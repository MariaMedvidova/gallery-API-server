const express = require('express');
var router = express.Router();
var path = require('path');

const app_id = "741673739820853"

router.get('/', (req, res) => {
    res.json({
        message: "Welcome to the API"
    })
})

//for user to ask for token  
router.get('/auth/facebook', (req,res)=>{
    res.send(`
    <html>
      <body>
        <a href="https://www.facebook.com/v6.0/dialog/oauth?client_id=${app_id}&response_type=token&redirect_uri=${encodeURIComponent('http://localhost:7100/oauth-redirect')}">
          Log In With Facebook
        </a>
      </body>
    </html>
  `);
})

// show user access token
router.get('/oauth-redirect', async (req, res) => {
    res.sendFile(path.join(__dirname, '../view', 'FBlogin.html'));
});

module.exports = router;
