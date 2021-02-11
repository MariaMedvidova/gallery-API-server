# Gallery API server
----
  The assignment is developed using Node.js technology. API services for creating galleries, storing images, and displaying galleries and images. Data storage is a filesystem (directory structure)

## Getting started:

To get the Node server running locally:

- `npm install` to install all required dependencies
- `npm start` to start server
- `http://localhost:7100/` - Server is listening on port 7100

## Application Structure:

- `app.js` - The entry point to application. This file defines our express server. It also requires the routes and models we'll be using in the application.
- `routes/` - This folder contains the route definitions for our API.
- `schemas/` - This folder contains the JSON schema definitions for validator.
- `data/` - This folder contains stored data and also a JSON file with information about stored galleries and images
- `view/`- This folder contains an html file serving to display the generated token during FB authentication

## Supported requests:
  
  Supported request types:

  `GET` | `POST` | `DELETE`

  * **`/gallery`**  
   `GET` - to display a JSON object of all galleries. Response contains an array of gallery objects, where path is the path directly usable for retrieving gallery content and name is the name of the gallery. If the gallery contains an image, then it is in the object as an image  
   `POST` - Creating a new gallery. Gallery name cannot contain /. The gallery name is sent in body request in JSON format
  
  * **`/gallery/{path}`**  
    `GET` - Returns a list of images in the gallery and information about the gallery in JSON format  
    `POST` - Upload an image to the selected gallery. It is protected by FB authentication. If the user uploads an image with the same name, the current date and time are added to the image name right before the extension. If the image name contains white spaces, they are changed to underscore.  
    `DELETE` - Delete the selected gallery or image according to the specified path
    
 * **`/images/{w}x{h}/{path}`**   
    `GET` - Generating a preview image according to the specified path, width and height (if one option is zero, it is calculated according to the other by maintaining the aspect ratio, if both are zero, the image will be displayed in original size)
 
 * **`/auth/facebook`**  
    `GET` - Link for Token generation is displayed.
  
    
## Dependencies

- [expressjs](https://github.com/expressjs/express) - The server for handling and routing HTTP requests
- [axios](https://github.com/axios/axios) - HTTP client node.js used for authentication
- [body-parser](https://github.com/expressjs/body-parser) - Body parsing middleware. For parse json incoming request bodies
- [jsonschema](github.com/tdegrunt/jsonschema) - For handling JSON schema validation
- [morgan](github.com/expressjs/morgan) - HTTP request logger middleware for node.js
- [multer](github.com/expressjs/multer) - For handling multipart/form-data, which is used for uploading images.
- [sharp](github.com/lovell/sharp) - For resizing images


## Error Handling

Error is displayed in json format as defined in the assignment

## FB Authentication

The photo upload request are authenticated using the `Authorization` header as a Bearer token **Facebook Oauth 2.0 token**. When entering `/auth/facebook` the user is redirected to a page where he can generate a token and then the token will be displayed in the help view `FBlogin.html`. 

Photo upload request must contain in the header Bearer token. Once user has sent a request with token, facebook graph api is used to get the user. Photos are saved to disk where is used the obtained ID in the file name. I used **Postman** for testing purposes.

>The default application ID for FB belongs to me, as the provided ID from "Programator.sk" did not support logging in
