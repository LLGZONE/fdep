const path = require('path');
const fs = require('fs');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const parser = require('@babel/parser');

class Dep {
  constructor({ path, depth = 0, deps = [], relativePath = '.' }) {
    this.path = path;
    this.depth = depth;
    this.deps = deps;
    this.relativePath = relativePath;
  }
}

// opts: depth, exclude, include
function fdeps(
  file,
  opts = {
    include: [],
    exclude: []
  }
) {
  const dep = new Dep({ path: file });
  const depth = opts.depth;
  const depthNoLimit = typeof opts.depth === 'number' ? false : true;
  walk(dep, depth, depthNoLimit);
  return dep;
}

function walk(dep, depth, depthNoLimit) {
  const content = fs.readFileSync(dep.path, 'utf8');
  const ast = parser.parse(content, {
    sourceType: 'module'
  });
  traverse(ast, {
    enter({ node }) {
      if (t.isImportDeclaration(node)) {
        const relativePath = node.source.value;
        const abPath = path.resolve(path.dirname(dep.path), relativePath);
        const subDep = new Dep({
          path: abPath,
          relativePath,
          depth: dep.depth + 1
        });
        if (subDep.depth <= depth || depthNoLimit) {
          dep.deps.push(subDep);
        }
      }
    }
  });

  dep.deps.forEach(subDep => {
    walk(subDep, depth, depthNoLimit);
  });
}

console.log(fdeps(path.resolve(process.cwd(), 'src/hello.js')));
