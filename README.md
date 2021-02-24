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
- `data/` - This folder contains stored data
- `view/`- This folder contains an html file serving to display the generated token during FB authentication

## Supported requests:
  
  Supported request types:

  `GET` | `POST` | `DELETE`

### /gallery 
*  `GET`   
to display a JSON object of all galleries. Response contains an array of gallery objects, where path is the path directly usable for retrieving gallery content and name is the name of the gallery. If the gallery contains an image, then it is in the object as an image   
**Response:**
    *  HTTP status code 200   
    returns all galleries in the defined JSON format - example:   
          ```json
                  {
                  "galleries": [
                    {
                      "name": "Cycling",
                      "path": "Cycling"
                    },
                    {
                      "name": "Wild life",
                      "path": "Wild%20life",
                      "image": {
                           "path": "4198191460195468drew-coffman-D1Pa78SnrH0-unsplash.jpg",
                           "fullpath": "Wild%20life/4198191460195468drew-coffman-D1Pa78SnrH0-unsplash.jpg",
                           "name": "4198191460195468drew-coffman-D1Pa78SnrH0-unsplash",
                           "modified": "2021-02-11T16:52:05.704Z"
                      }
                    }
                  ]
                  }     
          ```
              
    *  HTTP status code 500    
    filesystem errors (reading file) or validation error - example:     
          ```json
                  {
                    "code": 500,
                    "message": error.message
                  }
          ```     
*  `POST`    
Creating a new gallery. Gallery name cannot contain /. The gallery name is sent in body request in JSON format.    
**Response:**
    *  HTTP status code 201   
    Gallery was created, returns a JSON object with the path and name of the gallery - example:    
          ```json
                     {
                      "name": "Wild life",
                      "path": "Wild%20life"
                     }
          ```      
    *  HTTP status code 400   
    Incorrectly entered request - inappropriate content according to the scheme (not allowed to have the additional property, requires property, name not of a type string,...) -     example:   
          ```json
                    {
                     "code": 400,
                     "payload": {
                        "paths": [],
                        "validator": "required",
                        "example": null
                     },
                     "name": "INVALID_SCHEMA",
                     "description": "Bad JSON object: instance requires property \"name\""
                    }
          ```         
    *  HTTP status code 409    
    A gallery with the specified name already exists - example:    
          ```json
                   {
                    "code": 409,
                    "message": "A gallery with the specified name already exists"
                   }
          ```             
    *  HTTP status code 500    
    Undefined error (filesystem problems and others) - example:    
          ```json
                   {
                    "code": 500,
                    "message": e.message
                   }
          ```      

### /gallery/{path} 
*  `GET`    
Returns a list of images in the gallery and information about the gallery in JSON format  
**Response:**
    *  HTTP status code 200   
    Returns a list of images in JSON format in the gallery specified in the path parameter - example:    
    `http://localhost:7100/gallery/Cycling`    
          ```json
                   {
                    "gallery": {
                    "path": "Cycling",
                    "name": "Cycling"
                   },
                    "images": [
                        {
                         "path": "4198191460195468drew-coffman-D1Pa78SnrH0-unsplash-1613059843272.jpg",
                         "fullpath": "Cycling/4198191460195468drew-coffman-D1Pa78SnrH0-unsplash-1613059843272.jpg",
                         "name": "4198191460195468drew-coffman-D1Pa78SnrH0-unsplash-1613059843272",
                         "modified": "2021-02-11T16:10:43.400Z"
                        },
                        {
                         "path": "4198191460195468drew-coffman-D1Pa78SnrH0-unsplash-1613060085592.jpg",
                         "fullpath": "Cycling/4198191460195468drew-coffman-D1Pa78SnrH0-unsplash-1613060085592.jpg",
                         "name": "4198191460195468drew-coffman-D1Pa78SnrH0-unsplash-1613060085592",
                         "modified": "2021-02-11T16:14:45.651Z"
                        }
                    ]
                    }
          ```          
    *  HTTP status code 404     
    The selected gallery in the path parameter does not exist - example:  
          ```json
                   {
                    "code": 404,
                    "message": "The selected gallery does not exist"
                   }
          ```      
    *  HTTP status code 500      
    Undefined error - filesystem errors (reading file) or validation error - example:  
          ```json
                   {
                    "code": 500,
                    "message": e.message
                   }
          ```               
*  `POST`   
Upload an image to the selected gallery. It is protected by FB authentication. If the user uploads an image with the same name, the current date and time are added to the image name right before the extension. If the image name contains white spaces, they are changed to underscore.   
**Response:**   
    *  HTTP status code 201   
    Successful upload of the image in body content type form-data in the parameter named "file" to the selected gallery in path and authenticated in the header by the generated token - example:   
    `http://localhost:7100/gallery/Cycling`    
          ```json
                   {
                    "uploaded": [
                        {
                         "path": "4198191460195468m1.jpg",
                         "fullpath": "Cycling/4198191460195468m1.jpg",
                         "name": "4198191460195468m1",
                         "modified": "2021-02-12T18:27:31.741Z"
                        }
                    ]
                   }
          ```         
    *  HTTP status code 400     
    Upload file not found - example:  
          ```json
                   {
                    "code": 400,
                    "message": "Bad request - upload file not found"
                   }
          ```          
    *  HTTP status code 403   
    The token was not sent or not in the correct form - example:  
          ```json
                   {   
                    "code": 403,
                    "message": "You must be authorized to access. Click on the link below for authorization",
                    "link": "http://localhost:7100/auth/facebook"
                   }
          ```        
    *  HTTP status code 404   
    The specified gallery in the path parameter does not exist - example:  
          ```json
                   {
                    "code": 404,
                    "message": "Upload gallery not found"
                   }
          ```     
    *  HTTP status code 422   
    Only jpg and png format of uploaded file is allowed - example:  
          ```json
                   {
                    "code": 422,
                    "message": "File Format is incorrect"
                   }
          ```      
    *  HTTP status code 500   
    Invalid or expired token, or filesystem problem (read and write) - example:   
          ```json
                   {
                    "code": 500,
                    "message": e.message
                   }
          ```    
*  `DELETE`   
Delete the selected gallery or image according to the specified path
**Response:**   
    *  HTTP status code 200   
    Gallery / image deleted successfully - example:   
    `http://localhost:7100/gallery/Cycling/4198191460195468drew-coffman-D1Pa78SnrH0-unsplash.jpg`   
          ```json
                   {
                    "code": 200,
                    "message": "Image Cycling/4198191460195468drew-coffman-D1Pa78SnrH0-unsplash.jpg deleted successfully"
                   }
 
          # http://localhost:7100/gallery/Cycling`   
              
                   {
                    "code": 200,
                    "message": "Gallery Cycling deleted successfully"
                   }
          ```        
    *  HTTP status code 404   
    The selected gallery / image in path does not exist - example:   
          ```json
                   {
                    "code": 404,
                    "message": "The selected {path} does not exist"
                   }
          ```    
    *  HTTP status code 500   
    Undefined error - example:   
          ```json
                   {
                    "code": 500,
                    "message": e.message
                   }
          ```    
    
### /images/{w}x{h}/{path}   
*   `GET`    
Generating a preview image according to the specified path, width and height (if one option is zero, it is calculated according to the other by maintaining the aspect ratio, if both are zero, the image will be displayed in original size)    
**Response:**   
    *  HTTP status code 200   
    Generated a preview image in image/jpg format. 
    *  HTTP status code 403      
    The parameters w (width) and h (height) are validated using a regex expression. Only numbers equal to or greater than 0 and also zero leading numbers are allowed - example:   
          ```json
                   {
                    "code": 403,
                    "message": "Incorrectly entered required image dimensions"
                   }
          ```        
    *  HTTP status code 404   
    If the image does not exist in the selected path - example:   
          ```json
                   {
                    "code": 404,
                    "message": "Image not found"
                   }
          ```    
    *  HTTP status code 500   
    Undefined error - Failed to process image and generate preview - example:    
          ```json
                   {
                    "code": 500,
                    "message": "Failed to process image and generate preview."
                   }
          ```     
### /auth/facebook   
*   `GET`   
Link for Token generation is displayed. After the token is generated, it is displayed in the html page.   
**Response:**   
    *  HTTP status code 200   
    Displayed FBlogin.html
  
    
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

>The default application ID for FB belongs to me, as the provided ID from "Programator.sk" did not support logging in. It shows the error shown in the picture below.    

![error_app_programator](https://user-images.githubusercontent.com/58369175/107999797-9fdba580-6fe8-11eb-91b6-81b50dcefbb5.PNG)

