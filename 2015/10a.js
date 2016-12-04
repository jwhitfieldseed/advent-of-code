"use strict"
const input = "1113122113";
const n = 50;

let value = input;
for(let i = 0; i < n; i ++) {
  let groups = getGroups(value);
  let out = writeGroup(groups);
  //console.log(groups, out);
  value = out;
}

console.log(value.length);

function getGroups(str) {
  return str.split("")
    .map(d => +d)
    .reduce((out, e, i) => {
      let len = out.length;
      if(out[len - 1] && out[len - 1][0] === e) {
        out[len - 1].push(e);
      } else {
        out.push([e]);
      }
      return out;
    }, []);
}

function writeGroup(groups) {
  return groups
    .map(group => `${group.length}${group[0]}`)
    .join("");
}
