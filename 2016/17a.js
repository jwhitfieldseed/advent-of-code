const md5 = require('md5')

// returns [up, down, left, right]
function getSides (path) {
  const hash = md5(path)
  const sides = hash.substr(0, 4).split('').map(isOpen)
  return sides
}

function isOpen (sideChar) {
  return /^[bcdef]$/.test(sideChar)
}

function getNeighbours ([x, y], path) {
  let neighbours = []
  const [upOpen, downOpen, leftOpen, rightOpen] = getSides(path)

  // up, down, left, right
  if (y > 0 && upOpen) neighbours.push([[x, y - 1], path + 'U'])
  if (y < 3 && downOpen) neighbours.push([[x, y + 1], path + 'D'])
  if (x > 0 && leftOpen) neighbours.push([[x - 1, y], path + 'L'])
  if (x < 3 && rightOpen) neighbours.push([[x + 1, y], path + 'R'])

  return neighbours
}

// BFS, with no removal of visited nodes because the hash changes with each room visit
function search (passcode) {
  const queue = [[[0, 0], passcode]]

  while (true) {
    const [[x, y], code] = queue[0]

    // stop when we hit the bottom right square
    if (x === 3 && y === 3) {
      console.log(code)
      break
    }

    getNeighbours([x, y], code).forEach(neighbour => {
      queue.push(neighbour)
    })

    queue.shift()
  }
}

search('gdjjyniy')
