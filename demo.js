#!/usr/bin/env node

var Products = {
  A: {
    'LT': 1,
    'ST': 0,
    'SS': 25,
    'LLC': 0,
    'LS': 1,
    'Comp': {
      'C': 2,
      'D': 1,
    },
    'OH': 20,
    'AL': 0,
    'OO': [0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'GR': [0, 80, 50, 100, 60, 100, 70, 100, 60, 100, 50, 100, 50],
    'SR': [0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'POR': [0, 35, 100, 60, 100, 70, 100, 60, 100, 50, 100, 50, 0]
  },
  B: {
    'LT': 1,
    'ST': 0,
    'SS': 20,
    'LLC': 0,
    'LS': 1,
    'Comp': {
      'C': 1,
      'E': 1,
    },
    'OH': 40,
    'AL': 0,
    'OO': [0, 50, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'GR': [0, 70, 100, 50, 90, 60, 110, 60, 100, 50, 100, 50, 100],
    'SR': [0, 50, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'POR': [0, 0, 50, 90, 60, 110, 60, 100, 50, 100, 50, 100, 0],
  },
  C: {
    'LT': 1,
    'ST': 0,
    'SS': 5,
    'LLC': 2,
    'LS': 500,
    'Comp': {
      'E': 1,
      'F': 1,
    },
    'OH': 60,
    'AL': 0,
    'OO': [0, 200, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'SR': [0, 200, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  D: {
    'LT': 1,
    'ST': 0,
    'SS': 5,
    'LLC': 1,
    'LS': 200,
    'Comp': {
      'C': 1,
      'E': 2,
    },
    'OH': 60,
    'AL': 20,
    'OO': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'SR': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  E: {
    'LT': 2,
    'ST': 0,
    'SS': 50,
    'LLC': 3,
    'LS': 3,
    'Comp': {},
    'OH': 100,
    'AL': 0,
    'OO': [0, 1500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'SR': [0, 1500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  F: {
    'LT': 2,
    'ST': 1,
    'SS': 100,
    'LLC': 3,
    'LS': 2,
    'Comp': {

    },
    'OH': 100,
    'AL': 0,
    'OO': [0, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'SR': [0, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  }
}

function max(a, b) {
  return a > b ? a : b;
}

function dump_array(title, arr) {
  process.stdout.write(title + ':\t');
  for (var i = 0; i < arr.length; i++) {
    process.stdout.write(arr[i] + '\t');
  }
  process.stdout.write('\n');
}

function pretty_print(p) {
  dump_array('GR', p.GR);
  dump_array('SR', p.SR);
  dump_array('POH', p.POH);
  dump_array('PAB', p.PAB);
  dump_array('NR', p.NR);
  dump_array('PORcpt', p.PORcpt);
  dump_array('POR', p.POR);
}

function get_prodoct_by_llc(products) {
  var level = [];
  for (var p in products) {
    var product = products[p];
    if (typeof(level[product.LLC]) == 'undefined') {
      level[product.LLC] = [];
    }
    level[product.LLC].push(p);
  }
  return level;
}


function expand_product(parent, products) {
  for (var child in parent.Comp) {
    var t = products[child];
    if (!t.hasOwnProperty('GR')) {
      t.GR = [0];
    }
    if (!parent.hasOwnProperty('POR')) {
      return;
    }
    for (var i = 0; i < t.OO.length; i++) {
      if (!t.GR.hasOwnProperty(i)) {
        t.GR[i] = 0;
      }
      t.GR[i] += parent.POR[i] * parent.Comp[child];
    }
  }
}

function do_level_iteration(products, func) {
  var level = get_prodoct_by_llc(products);
  for (var l = 0; l < level.length; l++) {
    var level_products = level[l];
    for (var p in level_products) {
      func(p, products, level_products);
    }
  }
}

function get_FOQ_porcpt(NR, LS) {
  if (NR % LS === 0) {
    return (NR / LS) * LS;
  } else {
    return (Math.floor(NR / LS) + 1) * LS;
  }
}

function do_mrp(p, products) {
  p.PAB = [0];
  p.POH = [0];
  p.PORcpt = [0];
  p.NR = [0];
  if (!p.hasOwnProperty('POR')) {
    p.POR = [0];
  }
  p.PAB[0] = p.OH + max(p.SR[0], 0) - p.AL;

  for (var t = 1; t < p.OO.length; t++) {

    if (t == 1) {
      p.POH[t] = p.PAB[t - 1] + p.SR[t] - p.GR[t] - max(p.GR[t - 1], 0);
    } else {
      p.POH[t] = p.PAB[t - 1] + p.SR[t] - p.GR[t]
    }

    if (p.POH[t] < p.SS) {
      p.NR[t] = p.SS - p.POH[t];
      p.PORcpt[t] = get_FOQ_porcpt(p.NR[t], p.LS);
    } else {
      p.NR[t] = 0;
      p.PORcpt[t] = 0;
    }
    p.PAB[t] = p.POH[t] + p.PORcpt[t];
    p.POR[t - p.LT] = p.PORcpt[t];
  }
  // fill empty POR with 0
  for (var j = 0; j < p.OO.length; j++) {
    if (!p.POR.hasOwnProperty(j)) {
      p.POR[j] = 0;
    }
  }

  expand_product(p, products);
  pretty_print(p);
  console.log('\n');
}

function main() {
  do_level_iteration(Products, function(p, products, level_products) {
    var parent = products[level_products[p]];
    do_mrp(parent, products);
  });
}

main();
