const express = require('express');
const fs = require('fs');
var router = express.Router();
var multer = require('multer')
const axios = require('axios');
const schema_gallery_detail = require("../schemas/gallery_detail.json")
const schema_gallery_insert = require("../schemas/gallery_insert.json")
const schema_gallery_list = require("../schemas/gallery_list.json")

var Validator = require('jsonschema').Validator;
var v = new Validator();

//check if header contain token
var checkToken = (req, res, next) => {
    const header = req.headers['authorization'];

    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        req.token = token;
        next()
    } else {
        return res.status(403).json({
            "code": 403,
            "message": "You must be authorized to access. Click on the link below for authorization",
            "link": "http://localhost:7100/auth/facebook"
        })
    }
}

//check if directory form request exists
function checkUploadPath(req, res, next) {
    const path = encodeURIComponent(req.params.path)
    var dir = `./data/galleries/${path}/`;

    if (!fs.existsSync(dir)) {
        return res.status(404).json({
            "code": 404,
            "message": "Upload gallery not found"
        })
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

router.get('/', (req, res) => {
    try {
        let rawdata = fs.readFileSync('./data/galeries.json');
        let data = JSON.parse(rawdata);
        let returnData = {};
        returnData.galleries = [];

        //build new json to return
        for (i in data.galleries) {
            let gallery = ({
                "name": data.galleries[i].gallery.name,
                "path": data.galleries[i].gallery.path,
            })

            //if gallery contain picture
            if (Object.keys(data.galleries[i].images).length > 0) {
                let img = {}
                img = data.galleries[i].images[0]
                gallery.image = img
            }
            returnData.galleries.push(gallery);
        }

        //validate data with schema
        var result = v.validate(returnData, schema_gallery_list)
        if (!result.valid) {
            return res.status(500).json({
                "code": 500,
                "message": result.errors[0].name
            })
        }
        return res.status(200).json(returnData)
    }
    catch (e) {
        return res.status(500).json({
            "code": 500,
            "message": e.message
        })
    }
})

router.get('/:path', (req, res) => {
    try {
        let rawdata = fs.readFileSync('./data/galeries.json');
        let data = JSON.parse(rawdata);
        //encode path name
        const path = encodeURIComponent(req.params.path);

        //find gallery
        for (i in data.galleries) {
            if (data.galleries[i].gallery.path == path) {

                let gallery = {}
                gallery = data.galleries[i]

                //validate against schema
                var result = v.validate(gallery, schema_gallery_detail)
                if (!result.valid) {
                    return res.status(500).json({
                        "code": 500,
                        "message": "Undefined error"
                    })
                }
                return res.status(200).json(gallery)
            }
        }

        //gallery does not exist
        return res.status(404).json({
            "code": 404,
            "message": "The selected gallery does not exist"
        })

    } catch (e) {
        return res.status(500).json({
            "code": 500,
            "message": e.message
        })
    }
})

router.post('/', (req, res) => {
    try {
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

        const { name } = req.body
        const path = encodeURIComponent(name)

        var rawdata = fs.readFileSync('./data/galeries.json', 'utf8');
        data = JSON.parse(rawdata);

        //check if gallery with the specified name already exists
        for (i in data.galleries) {
            if (data.galleries[i].gallery.name == name) {
                return res.status(409).json({
                    "code": 409,
                    "message": "A gallery with the specified name already exists"
                })
            }
        }

        //creating json
        const galleryDetail = {
            "gallery": {
                path: path,
                name: name
            },
            "images": []
        }

        //add galery to the file ./data/galeries.json
        data.galleries.push(galleryDetail);
        fs.writeFile('./data/galeries.json', JSON.stringify(data), function (err) {
            if (err) throw err;
        })

        //make new directory
        var dir = `./data/galleries/${path}/`;
        fs.mkdirSync(dir)
        return res.status(201).json(galleryDetail.gallery)
    }
    catch (e) {
        return res.status(500).json({
            "code": 500,
            "message": e.message
        })
    }
})

router.post('/:path', checkToken, checkUploadPath, async (req, res) => {
    try {
        const accessToken = req.token;

        // Get data of the Facebook user associated with the access token.
        const data = await axios.get(`https://graph.facebook.com/me?access_token=${encodeURIComponent(accessToken)}`).
            then(res => res.data);

        req.userId = data.id;

    } catch (err) {
        //console.log(err);
        return res.status(500).json({ message: err.response.data || err.message });
    }

    //upload file
    let upload = multer({ storage: storage, fileFilter: fileFilter }).single('file')

    upload(req, res, function (err) {
        if (req.INCORRECT_FORMAT) {
            return res.status(400).json({
                "code": 400,
                "message": "File Format is incorrect"
            })
        }
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                "code": 400,
                "message": "Bad request - upload file not found"
            })
        }

        //creating new IMG record to JSON file
        const dir = encodeURIComponent(req.params.path)
        const file = req.file;
        var dotIndex = file.filename.lastIndexOf(".");
        let date = new Date();
        var newImgRecord = {
            "path": file.filename,
            "fullpath": dir + "/" + file.filename,
            "name": file.filename.substring(0, dotIndex),
            "modified": date.toISOString()
        }

        //read from JSON file
        var rawdata;
        try {
            rawdata = fs.readFileSync('./data/galeries.json', 'utf8');
        } catch (e) {
            return res.status(500).json({
                "code": 500,
                "message": err.message
            })
        }
        data = JSON.parse(rawdata);

        //find gallery and push IMG
        for (i in data.galleries) {
            if (data.galleries[i].gallery.path == dir) {
                data.galleries[i].images.push(newImgRecord);
                fs.writeFile('./data/galeries.json', JSON.stringify(data), function (err) {
                    if (err) throw err;
                })
                return res.status(201).json({
                    "uploaded": [newImgRecord]
                })
            }
        }

        if (err) {
            return res.status(500).json({
                "code": 500,
                "message": err.message
            })
        }

        return res.status(404).json({
            "code": 404,
            "message": "Upload gallery not found"
        })
    })
})

router.delete('/:dir/:img?', (req, res) => {
    try {
        let rawdata = fs.readFileSync('./data/galeries.json');
        let data = JSON.parse(rawdata);
        //encode path name
        const dir = encodeURIComponent(req.params.dir)

        //check if exist and encode if yes
        var img = req.params.img;
        if (img) {
            img = encodeURIComponent(img)
        }

        for (i in data.galleries) {
            //if dir match
            if (data.galleries[i].gallery.path == dir) {

                //delete image form gallery
                if (img && (Object.keys(data.galleries[i].images).length > 0)) {

                    //find position of image and if exist delete
                    const index = data.galleries[i].images.findIndex(x => x.path === img);
                    if (index !== -1) {
                        data.galleries[i].images.splice(index, 1);
                        fs.writeFileSync('./data/galeries.json', JSON.stringify(data))

                        //asynchronously delete file from filesystem
                        fs.unlink("./data/galleries/" + dir + "/" + img, (err) => {
                            if (err) {
                                throw err;
                            }
                        })

                        return res.status(200).json({
                            "code": 200,
                            "message": `Image ${dir}/${img} deleted successfully`
                        })
                    }
                }

                //delete gallery from galleries
                if (img === undefined) {
                    data.galleries.splice(i, 1)
                    fs.writeFileSync('./data/galeries.json', JSON.stringify(data))

                    //asynchronously delete directory recursively from filesystem
                    fs.rmdir("./data/galleries/" + dir, { recursive: true }, (err) => {
                        if (err) {
                            throw err;
                        }
                    });

                    return res.status(200).json({
                        "code": 200,
                        "message": `Gallery ${dir} deleted successfully`
                    })
                }
            }
        }
        let path = img === undefined ? dir : `${dir}/${img}`
        //do not match anything
        return res.status(404).json({
            "code": 404,
            "message": `The selected ${path} does not exist`
        })
    }
    catch (e) {
        return res.status(500).json({
            "code": 500,
            "message": e.message
        })
    }
})

module.exports = router;
