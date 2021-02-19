const express = require('express');
const fs = require('fs');
var router = express.Router();
var multer = require('multer')
const axios = require('axios');
const path_module = require('path');

const schema_gallery_detail = require("../schemas/gallery_detail.json")
const schema_gallery_insert = require("../schemas/gallery_insert.json")
const schema_gallery_list = require("../schemas/gallery_list.json")

var Validator = require('jsonschema').Validator;
var v = new Validator();

//to send a response
var sendResponse = (res, code, message) => {
    var response = {
        "code": code,
        "message": message
    }
    return res.status(parseInt(code)).json(response);
}

//check if header contain token
var checkToken = (req, res, next) => {
    const header = req.headers['authorization'];

    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        req.token = token;
        next()
    } else {
        sendResponse(res, 401, "You must be authorized to access. Click on the link below for authorization. http://localhost:7100/auth/facebook")
    }
}

//check if directory form request exists
var checkGallery = (req, res, next) => {
    const path = encodeURIComponent(req.params.path)
    var dir = `./data/galleries/${path}/`;

    if (!fs.existsSync(dir)) {
        return sendResponse(res, 404, "Gallery not found")
    }
    next()
}

//setting filename and directory
const storage = multer.diskStorage({
    //set path to gallery folder form request
    destination: function (req, file, cb) {
        var dir = `./data/galleries/${encodeURIComponent(req.params.path)}/`;
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        //replace whitespace with underscore
        let decodeFileName = req.userId + file.originalname.replace(/\s/g, '_')
        var imgPath = `./data/galleries/${encodeURIComponent(req.params.path)}/${decodeFileName}`;
        if (!fs.existsSync(imgPath)) {
            return cb(null, decodeFileName)
        }

        //change filename if exist that you add date before extension
        var dotIndex = decodeFileName.lastIndexOf(".");
        var newFileName = "";
        //in case file does not have extension
        if (dotIndex == -1) newFileName = decodeFileName + '-' + Date.now();
        else newFileName = decodeFileName.substring(0, dotIndex) + '-' + Date.now() + decodeFileName.substring(dotIndex);
        cb(null, newFileName)
    }
})

//filter only pictures
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        return cb(null, true)
    } else {
        req.INCORRECT_FORMAT = true
        cb(new Error('only images files are allowed'), false)
    }
}

//to return JSON gallery object
const getGalleryData = async (dir) => {
    return new Promise((resolve, reject) => {
        let gallery = ({
            "name": decodeURI(dir),
            "path": dir
        })
        getImagesData(dir, true)
            .then((img) => {
                if (img) {
                    gallery.image = img;
                }
                resolve(gallery);
            })
            .catch((err) => {
                reject(err)
            })
    })
}

const getImagesData = async (dir, onlyOne) => {
    return new Promise((resolve, reject) => {
        //check if gallery contain picture
        fs.promises.readdir('./data/galleries/' + dir)
            .then((files) => {
                //if gallery contain picture and we need only first one
                if (files.length > 0 && onlyOne) {
                    var img = {};
                    const pathName = path_module.join('./data/galleries/' + dir, files[0])
                    fs.promises.stat(pathName)
                        .then((stats) => {
                            var dotIndex = files[0].lastIndexOf(".");
                            //build new JSON img object
                            var img = {
                                "path": files[0],
                                "fullpath": dir + "/" + files[0],
                                "name": decodeURI(files[0].substring(0, dotIndex)),
                                "modified": stats.mtime.toString()
                            }
                            resolve(img);
                        })
                }
                //if gallery contain picture and we need all picture
                else if (files.length > 0) {
                    let promises = [];

                    //push all promises to array
                    for (let file of files) {
                        const pathName = path_module.join('./data/galleries/' + dir, file)

                        promises.push(fs.promises.stat(pathName))
                    }

                    //to resolve all promises in array and then return
                    Promise.all(promises)
                        .then((stats) => {
                            //build new json to return
                            var returnData = [];
                            var i = 0
                            for (let stat of stats) {
                                var dotIndex = files[i].lastIndexOf(".");
                                //build new JSON img object
                                var img = {
                                    "path": files[i],
                                    "fullpath": dir + "/" + files[i],
                                    "name": decodeURI(files[i].substring(0, dotIndex)),
                                    "modified": stat.mtime.toString()
                                }
                                i++;
                                //console.log(img)
                                returnData.push(img)
                            }

                            resolve(returnData)
                        })
                }
                //if gallery does not cointain picture
                else {
                    resolve();
                }
            })
            .catch((err) => {
                reject(err)
            })
    })
}

router.get('/', async (req, res) => {
    //read all directories
    fs.promises.readdir('./data/galleries/')
        .then((dirs) => {
            let promises = [];

            //push all promises to array
            for (let dir of dirs) {
                promises.push(getGalleryData(dir))
            }

            //to resolve all promises in array and then return
            Promise.all(promises)
                .then((galleries) => {

                    //build new json to return
                    var returnData = {};
                    returnData.galleries = galleries;

                    console.log(returnData);

                    //validate data with schema
                    var result = v.validate(returnData, schema_gallery_list)
                    if (!result.valid) {
                        return sendResponse(res, 500, result.errors)
                    }
                    return res.status(200).json(returnData)
                })
        })
        .catch((err) => {
            return sendResponse(res, 500, err.message)
        })
})

router.get('/:path', checkGallery, (req, res) => {
    const dir = encodeURIComponent(req.params.path)

    //get data about all images in gallery
    getImagesData(dir, false)
        .then((images) => {
            //creating json
            const galleryDetail = {
                "gallery": {
                    path: dir,
                    name: dir
                },
                "images": []
            }
            if (images) galleryDetail.images = images;

            //validate against schema
            var result = v.validate(galleryDetail, schema_gallery_detail)
            if (!result.valid) {
                sendResponse(res, 500, result.errors[0].stack)
            }

            return res.status(200).json(galleryDetail)
        })
        .catch((err) => {
            return sendResponse(res, 500, err.message)
        })
})

router.post('/', (req, res) => {

    const { name } = req.body
    const path = encodeURIComponent(name)
    var dir = `./data/galleries/${path}/`;

    //validate request against schema
    var result = v.validate(req.body, schema_gallery_insert)
    if (!result.valid) {
        //Bad request - inappropriate content according to the scheme
        return res.status(400).json({
            "code": 400,
            "payload": {
                "paths": [],
                "validator": result.errors[0].name,
                "example": null
            },
            "name": "INVALID_SCHEMA",
            "description": "Bad JSON object: " + result.errors[0].stack
        })
    }
    else if (!fs.existsSync(dir)) {
        //make new directory
        fs.mkdirSync(dir)
        return res.status(201).json({
            "name": name,
            "path": path
        })
    }
    else {
        return sendResponse(res, 409, "A gallery with the specified name already exists")
    }
})

router.post('/:path', checkToken, checkGallery, async (req, res) => {
    try {
        const accessToken = req.token;

        // Get data of the Facebook user associated with the access token.
        const data = await axios.get(`https://graph.facebook.com/me?access_token=${encodeURIComponent(accessToken)}`).
            then(res => res.data);

        req.userId = data.id;

    } catch (err) {
        return sendResponse(res, 401, err.response.data || err.message)
    }

    //upload file
    let upload = multer({ storage: storage, fileFilter: fileFilter }).single('file')

    upload(req, res, function (err) {
        if (req.INCORRECT_FORMAT) {
            return sendResponse(res, 422, "File Format is incorrect")
        }
        if (err instanceof multer.MulterError) {
            return sendResponse(res, 400, "Bad request - upload file not found")
        }
        if (err) {
            return sendResponse(res, 500, err.message)
        }

        //get data about uploaded img
        getImagesData(encodeURIComponent(req.params.path), true)
            .then((imgData) => {
                return res.status(201).json({
                    "uploaded": [imgData]
                })
            })
            .catch((err) => {
                return sendResponse(res, 500, err.message)
            })
    })
})

router.delete('/:dir/:img?', (req, res) => {
    try {
        //encode path name
        const dir = encodeURIComponent(req.params.dir)
        var img = req.params.img;

        //check if exist and encode if yes and delete image form gallery
        if (img) {
            img = encodeURIComponent(img)
            var imgPath = "./data/galleries/" + dir + "/" + img

            //do not match anything
            if (!fs.existsSync(imgPath)) {
                console.log("hladam" + imgPath)
                return sendResponse(res, 404, "Image not found")
            }
            //asynchronously delete file from filesystem
            else {
                fs.unlink(imgPath, (err) => {
                    if (err) {
                        return sendResponse(res, 500, err.message)
                    }
                })
                return sendResponse(res, 200, `Image ${dir}/${img} deleted successfully`)
            }
        }

        //delete gallery from galleries
        if (img === undefined) {
            var dirPath = `./data/galleries/${dir}/`;

            //do not match anything
            if (!fs.existsSync(dirPath)) {
                return sendResponse(res, 404, "Gallery not found")
            }

            //asynchronously delete directory recursively from filesystem
            fs.rmdir(dirPath, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                }
            });
            return sendResponse(res, 200, `Gallery ${dir} deleted successfully`)
        }
    }
    catch (e) {
        return sendResponse(res, 500, e.message)
    }
})

module.exports = router;
