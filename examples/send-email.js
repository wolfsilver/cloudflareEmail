// Example: Send a simple email using the API

const API_URL = 'https://your-worker.workers.dev';

async function sendEmail() {
  const response = await fetch(`${API_URL}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [
        { email: 'recipient@example.com', name: 'Recipient Name' }
      ],
      subject: 'Hello from Cloudflare Workers',
      htmlBody: `
        <html>
          <body>
            <h1>Welcome!</h1>
            <p>This is a test email sent from Cloudflare Email Workers.</p>
            <p>Features:</p>
            <ul>
              <li>HTML email support</li>
              <li>Mailing lists</li>
              <li>File attachments</li>
            </ul>
          </body>
        </html>
      `,
      from: { 
        email: 'noreply@example.com', 
        name: 'My App' 
      }
    })
  });

  const data = await response.json();
  console.log('Response:', data);
}

sendEmail();
