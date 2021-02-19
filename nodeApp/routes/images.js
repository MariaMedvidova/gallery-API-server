const express = require('express');
const fs = require('fs');
const sharp = require("sharp");
var router = express.Router();

// validate params with regular expression = positive number, also zero leading
const validateImgParams = (params) => {
    if (params.match("^(0+|(0*[1-9][0-9]*))x(0+|(0*[1-9][0-9]*))")) return true;
    return false
}

//parse width and height form request
const getValues = (params) => {
    var w = params.substring(0, params.indexOf("x"));
    var h = params.substring(params.indexOf("x") + 1, params.length);

    return {
        w: parseInt(w),
        h: parseInt(h)
    };
}

var sendResponse = (res,code, message) => {
    var response = {
        "code": code,
        "message": message
    }
    return res.status(ParseInt(code)).json(response);
}

router.get('/:params/:dir/:img', async (req, res) => {
    const { params, dir, img } = req.params

    //validate width and height of required picture
    if (!validateImgParams(params)) {
        return sendResponse(res,403,"Incorrectly entered required image dimensions")
    }

    //check if file exist
    const path = `./data/galleries/${encodeURIComponent(dir)}/${img}`;
    if (!fs.existsSync(path)) {
        return sendResponse(res,404, "Image not found")
    }

    //extract width and height from params
    const { w, h } = getValues(params)

    //load and resize file
    var data;

    //load IMG and if necessary also resize it
    try {
        if (w == 0 && h == 0) {
            data = await sharp(path)
        } else if (w == 0 && h != 0) {
            data = await sharp(path).resize(null, h)
        } else if (w != 0 && h == 0) {
            data = await sharp(path).resize(w)
        } else {
            data = await sharp(path).resize(w, h)
        }
    } catch (e) {
        return sendResponse(res,500, "Failed to process image and generate preview.")
    }

    //send resized image
    data.toBuffer()
        .then(data => {
            res.writeHead(200, { 'Content-Type': 'image/jpg' });
            res.end(data, 'Base64');
        })
        .catch(e => {
            return sendResponse(res,500, e.message)
        })
})


module.exports = router;
