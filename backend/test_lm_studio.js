const url = 'http://127.0.0.1:1234/v1/models';
fetch(url)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err.message));
