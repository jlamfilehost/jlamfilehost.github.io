const fs = require('fs');
const path = require('path');

// get base dirname (from https://gist.github.com/geekiam/e2e3e0325abd9023d3a3)
const base_dir = path.dirname(require.main.filename || process.mainModule.filename);
const first_entry = '.';

// ignored filenames
const ignore = [ /^\.git$/, /\.swp$/, /^index\.(js|html)$/, /^readme\.md$/i , /^styles\.css$/ ];

// create index.html for given directory
const create_index = (dirname, dir_list, file_list, all_file_list) => {
  let res = `<!doctype html>
<html>
  <head>
    <title>Directory Listing</title>
    <link rel='stylesheet' href='${base_dir}/styles.css'>
  </head>
  <body>
    <h1>Directories</h1>`;

  // sort elements by name property
  const sort_name = (a, b) => a.name.localeCompare(b.name);
  const is_link = filename => /\.link$/.test(filename);
  const get_url = filename => {
    if(is_link(filename)) {
      return fs.readFileSync(base_dir + '/' + dirname + '/' + filename, 'utf-8');
    } else
      return filename;
  };

  // print directories
  let dir_list_full = dir_list.concat(dirname != first_entry ? [{ name: '..' }] : []).sort(sort_name);
  for(let file of dir_list_full) {
    res += `<p><a href='${file.name}/index.html'>${file.name}</a></p>`;
  }

  res += '<h1>Files</h1>';
  // print files
  file_list.sort(sort_name);
  for(let file of file_list) {
    res += `<p><a href='${get_url(file.name)}' target='_blank'>${file.name}</a> ${is_link(file.name) ? '' : '(' + file.size + ')'}</p>`;
  }

  if(dir_list.length > 0) {
    res += '<h1>Nested files</h1>';
    // print nested files
    all_file_list.sort(sort_name);
    for(let file of all_file_list) {
      res += `<p><a href='${get_url(file.name)}' target='_blank'>${file.name}</a> ${is_link(file.name) ? '' : '(' + file.size + ')'}</p>`;
    }
  }
  

  res += `</body>
</html>`;

  fs.writeFileSync(base_dir + '/' + dirname + '/index.html', res);
};

// read given directory
const read_dir = dirname => {
  // directories and files
  let dir_list = [];
  let file_list = [];
  let all_file_list = [];

  let files = fs.readdirSync(base_dir + '/' + dirname);
  file_iterator: for(let filename of files) {

    // ignore if in ignore
    for(let ignore_pattern of ignore)
      if(ignore_pattern.test(filename))
        continue file_iterator;

    console.log("PATH: " + filename);
    let stats = fs.statSync(base_dir + '/' + dirname + '/' + filename);
    (stats.isDirectory() ? dir_list : file_list).push({
      name: filename,
      size: stats.size
    });
    if(stats.isDirectory()) {
      let nested_files = read_dir(dirname + '/' + filename)[2].map(f => ({
        name: filename + '/' + f.name,
        size: f.size
      }));
      all_file_list = all_file_list.concat(nested_files); 
    }
  }
  all_file_list = all_file_list.concat(file_list);

  // create directory page
  create_index(dirname, dir_list, file_list, all_file_list);

  return [dir_list, file_list, all_file_list];
};

// begin recursive reading
let [dir_list, file_list, all_file_list] = read_dir(first_entry);

console.log(dir_list, file_list, all_file_list);
