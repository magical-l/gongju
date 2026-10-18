'use strict';

let pass = 0;
let fail = 0;
const failures = [];

function describe(name, fn) {
  console.log('\n' + name);
  fn();
}

function it(name, fn) {
  try {
    fn();
    pass += 1;
    console.log('  ✓ ' + name);
  } catch (err) {
    fail += 1;
    failures.push({ name, err });
    console.log('  ✗ ' + name);
    console.log('    ' + (err && err.message ? err.message : err));
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error((message || '值不相等') + '：期望 ' + JSON.stringify(expected) + '，实际 ' + JSON.stringify(actual));
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error((message || '结构不相等') + '：期望 ' + b + '，实际 ' + a);
}

function assertTruthy(value, message) {
  if (!value) throw new Error(message || '期望为真');
}

function assertThrows(fn, includes, message) {
  try {
    fn();
  } catch (err) {
    if (includes && String(err.message).indexOf(includes) === -1) {
      throw new Error((message || '异常信息不符') + '：期望包含「' + includes + '」，实际「' + err.message + '」');
    }
    return;
  }
  throw new Error(message || '期望抛出异常');
}

function summary() {
  console.log('\n通过 ' + pass + '，失败 ' + fail);
  if (fail) process.exit(1);
}

module.exports = { describe, it, assertEqual, assertDeepEqual, assertTruthy, assertThrows, summary };
