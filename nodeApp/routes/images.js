const express = require('express');
const fs = require('fs');
const sharp = require("sharp");
var router = express.Router();

// validate params with regular expression = positive number, also zero leading
const validateImgParams = (params) => {
    if (params.match("^(0+|(0*[1-9][0-9]*))x(0+|(0*[1-9][0-9]*))")) return true;
    return false
}

const getValues = (params) => {
    var w = params.substring(0, params.indexOf("x"));
    var h = params.substring(params.indexOf("x") + 1, params.length);

    return {
        w: parseInt(w),
        h: parseInt(h)
    };
}

router.get('/:params/:dir/:img', async (req, res) => {
    const { params, dir, img } = req.params

    //validate width and height of required picture
    if (!validateImgParams(params)) {
        return res.status(500).json({
            "code": 500,
            "message": "Incorrectly entered required image dimensions"
        })
    }

    //check if file exist
    const path = `./data/galleries/${dir}/${img}`;
    if (!fs.existsSync(path)) {
        return res.status(404).json({
            "code": 404,
            "message": "Image not found"
        })
    }

    //extract width and height from params
    const { w, h } = getValues(params)

    //load and resize file
    var data;

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
        return res.status(500).json({
            "code": 500,
            "message": " Failed to process image and generate preview."
        })
    }

    //send resized image
    data.toBuffer()
        .then(data => {
            res.writeHead(200, { 'Content-Type': 'image/jpg' });
            res.end(data, 'Base64');
        })
        .catch(e => {
            return res.status(500).json({
                "code": 500,
                "message": e.message
            })
        })
})


module.exports = router;
