// Example: Manage mailing lists using the API

const API_URL = 'https://your-worker.workers.dev';

async function createMailingList() {
  const response = await fetch(`${API_URL}/api/lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Newsletter Subscribers',
      description: 'Monthly newsletter recipients'
    })
  });

  const data = await response.json();
  console.log('Created list:', data);
  return data.list.id;
}

async function addEmailsToList(listId, emails) {
  for (const email of emails) {
    const response = await fetch(`${API_URL}/api/lists/${listId}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    console.log(`Added ${email}:`, data.success);
  }
}

async function sendToList(listId) {
  const response = await fetch(`${API_URL}/api/send-to-list/${listId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: 'Monthly Newsletter - December 2024',
      htmlBody: `
        <html>
          <body>
            <h1>Newsletter</h1>
            <p>Here's what's new this month...</p>
          </body>
        </html>
      `,
      from: { 
        email: 'newsletter@example.com', 
        name: 'Newsletter' 
      }
    })
  });

  const data = await response.json();
  console.log('Bulk send result:', data);
}

async function main() {
  // Create a mailing list
  const listId = await createMailingList();

  // Add emails to the list
  await addEmailsToList(listId, [
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
  ]);

  // Send email to the entire list
  await sendToList(listId);
}

main();
