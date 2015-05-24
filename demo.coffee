#!/usr/bin/env coffee

Products = 
  A:
    'LT': 1
    'ST': 0
    'SS': 25
    'LLC': 0
    'LS': 1
    'Comp':
      'C': 2
      'D': 1
    'OH': 20
    'AL': 0
    'OO': [0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    'GR': [0, 80, 50, 100, 60, 100, 70, 100, 60, 100, 50, 100, 50]
    'SR': [0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'POR': [0, 35, 100, 60, 100, 70, 100, 60, 100, 50, 100, 50, 0]
  B:
    'LT': 1
    'ST': 0
    'SS': 20
    'LLC': 0
    'LS': 1
    'Comp':
      'C': 1
      'E': 1
    'OH': 40
    'AL': 0
    'OO': [0, 50, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    'GR': [0, 70, 100, 50, 90, 60, 110, 60, 100, 50, 100, 50, 100]
    'SR': [0, 50, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    'POR': [0, 0, 50, 90, 60, 110, 60, 100, 50, 100, 50, 100, 0]
  C:
    'LT': 1
    'ST': 0
    'SS': 5
    'LLC': 2
    'LS': 500
    'Comp':
      'E': 1
      'F': 1
    'OH': 60
    'AL': 0
    'OO': [0, 200, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    'SR': [0, 200, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  D:
    'LT': 1
    'ST': 0
    'SS': 5
    'LLC': 1
    'LS': 200
    'Comp':
      'C': 1
      'E': 2
    'OH': 60
    'AL': 20
    'OO': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    'SR': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  E:
    'LT': 2
    'ST': 0
    'SS': 50
    'LLC': 3
    'LS': 3
    'Comp': {}
    'OH': 100
    'AL': 0
    'OO': [0, 1500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    'SR': [0, 1500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  F:
    'LT': 2
    'ST': 1
    'SS': 100
    'LLC': 3
    'LS': 2
    'Comp': {}
    'OH': 100
    'AL': 0
    'OO': [0, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    'SR': [0, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

dump_array = (title, arr) ->
  process.stdout.write "#{title}:\t"
  arr.forEach (d) ->
    process.stdout.write "#{d}\t"
  process.stdout.write "\n"

pretty_print = (p) ->
  dump_array "GR", p.GR
  dump_array "SR", p.SR
  dump_array "POH", p.POH
  dump_array "PAB", p.PAB
  dump_array "NR", p.NR
  dump_array "PORcpt", p.PORcpt
  dump_array "POR", p.POR
  return true

get_product_by_llc = (productcs) ->
  levels = []
  for name, p of productcs
    if levels[p.LLC] is undefined
      levels[p.LLC] = []
    levels[p.LLC].push name

  return levels

expand_product = (parent, productcs) ->
  for name, count of parent.Comp
    t = productcs[name]
    if not t.hasOwnProperty 'GR'
      t.GR = [0]
    if not parent.hasOwnProperty 'POR'
      return

    for i in [0...12]
      if not t.GR.hasOwnProperty i
        t.GR[i] = 0
      t.GR[i] += parent.POR[i] * parent.Comp[name]
  return

do_level_iteration = (productcs, func) ->
  level = get_product_by_llc productcs
  for l in [0...level.length]
    level_products = level[l]
    for p in level_products
      obj = this
      func.call obj, p, productcs
  return

get_FOR_PORcpt = (NR, LS) -> 
  if NR % LS is 0
    (NR / LS) * LS
  else
    (NR // LS + 1) * LS

do_mrp = (p, productcs) ->
  p.PAB = [0]
  p.POH = [0]
  p.PORcpt = [0]
  p.NR = [0]
  if not p.hasOwnProperty 'POR'
    p.POR = [0]
  p.PAB[0] = p.OH + Math.max(p.SR[0], 0) - p.AL

  for t in [1...12]
    if t == 1
      p.POH[t] = p.PAB[t - 1] + p.SR[t] -  p.GR[t] - Math.max(p.GR[t - 1], 0)
    else
      p.POH[t] = p.PAB[t - 1] + p.SR[t] - p.GR[t]

    if p.POH[t] < p.SS
      p.NR[t] = p.SS - p.POH[t]
      p.PORcpt[t] = get_FOR_PORcpt p.NR[t], p.LS
    else
      p.NR[t] = 0
      p.PORcpt[t] = 0

    p.PAB[t] = p.POH[t] + p.PORcpt[t]
    p.POR[t - p.LT] = p.PORcpt[t];

  for j in [0...12]
    if not p.POR.hasOwnProperty j
      p.POR[j] = 0
  
  expand_product p, productcs
  pretty_print p
  console.log '\n'
  return

do_level_iteration Products, (p, productcs) ->
  parent = productcs[p]
  do_mrp parent, productcs
  return

