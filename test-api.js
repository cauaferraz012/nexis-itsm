const tokenUrl = 'http://localhost:3001/auth/register';
const ticketUrl = 'http://localhost:3001/tickets';

async function test() {
  const email = `test${Date.now()}@test.com`;
  
  // Register
  let res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email, password: 'test', role: 'USER' })
  });
  let data = await res.json();
  const token = data.access_token;
  console.log('Token:', token ? 'OK' : 'FAIL');

  // Create Ticket via FormData
  const formData = new FormData();
  formData.append('title', 'Teste via script');
  formData.append('description', 'Script description');
  formData.append('priority', 'MEDIUM');
  formData.append('type', 'INCIDENT');
  formData.append('category', 'Sistemas/Software');

  res = await fetch(ticketUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    console.log('ERROR:', res.status, await res.text());
  } else {
    console.log('SUCCESS:', await res.json());
  }
}

test();
