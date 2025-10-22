// Example: Upload files and use them in emails

const API_URL = 'https://your-worker.workers.dev';
const fs = require('fs');

async function uploadFile(filePath) {
  const fileData = fs.readFileSync(filePath);
  const fileName = filePath.split('/').pop();
  
  const formData = new FormData();
  const blob = new Blob([fileData]);
  formData.append('file', blob, fileName);

  const response = await fetch(`${API_URL}/api/files`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  console.log('Uploaded file:', data);
  return data.file;
}

async function sendEmailWithImage(imageUrl) {
  const response = await fetch(`${API_URL}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [{ email: 'recipient@example.com' }],
      subject: 'Email with Image',
      htmlBody: `
        <html>
          <body>
            <h1>Check out this image!</h1>
            <img src="${imageUrl}" alt="Uploaded Image" style="max-width: 600px;">
            <p>Image stored in Cloudflare R2</p>
          </body>
        </html>
      `
    })
  });

  const data = await response.json();
  console.log('Email sent:', data);
}

async function main() {
  // Upload an image
  const uploadedFile = await uploadFile('./path/to/image.jpg');
  
  // Use the image in an email
  const imageUrl = `${API_URL}${uploadedFile.url}`;
  await sendEmailWithImage(imageUrl);
}

main();
