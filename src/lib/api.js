export default {
	TOTP_REGISTRATION: 'https://script.google.com/macros/s/AKfycbzH3DaV3YEHev05MGCn7zHUllL_srldkn54T6K4PHuUDhq1mdOCYW-2jwDsSPT1rB0jCw/exec',
  TOTP_VERIFICATION: 'https://script.google.com/macros/s/AKfycbzi-lNq1i57E04iEB00tY7b7Q67SxGZFvFS_4W0prxZzbEppQqYPGl5TLl7kmDz0XVClA/exec',
  KEYS_REGISTRATION: 'https://script.google.com/macros/s/AKfycbxJAaOwe97IjZ7jCUbB8LZJY7w91q_gqOb22ly7Z6lWaS7n7_4oKG3l_0S5ir7tI9qMaQ/exec',
	post,
	get,
	getText,
	getNetInfo,
};

async function getNetInfo() {
	const response = await fetch('https://ipinfo.io/json?token=73776caa3095f1');
	const result = await response.json();
	return result;
}

async function post(endpoint, payload) {
	console.debug('POST', endpoint, payload);
  const response = await fetch(endpoint, {
		method: 'POST',
		body: JSON.stringify(payload),
		headers: {
			'Content-Type': 'text/plain;charset=utf-8', // CORSのプリフライトリクエストを避けるため
		},
	});
	const result = await response.json();
	console.debug('POST RESPONSE', result);
	if (result.status === 'success') {
		return result;
	} else {
		throw new Error(result.message || 'Unknown error occurred.');
	}
}

async function get(endpoint) {
	const response = await fetch(endpoint);
	const result = await response.json();
	if (result.status === 'success') {
		return result;
	} else {
		throw new Error(result.message || 'Unknown error occurred.');
	}
}

async function getText(endpoint) {
	const response = await fetch(endpoint);
	const result = await response.text();
	return result;
}