
const url = 'https://youtu.be/Aju6rniDjr0';
const cleanUrl = url.trim();
const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?\s]*).*/;
const match = cleanUrl.match(regExp);
console.log(match ? match[2] : null, match ? match[2].length : null);

