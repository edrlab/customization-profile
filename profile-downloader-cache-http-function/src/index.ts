import { http } from '@google-cloud/functions-framework';
http('profile-downloader-cache-http-function', (req, res) => {
  // Your code here
  console.log("Hello From My Cloud Function !\n");

  // Send an HTTP response
  res.send('OK');
});
