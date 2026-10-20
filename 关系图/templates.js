(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'));
  else root.RGTemplates = factory(root.RGModel);
})(typeof self !== 'undefined' ? self : this, function (M) {
  'use strict';

  if (!M) return { list: [] };

  function addEntity(doc, id, name, prototypeId, position, style) {
    return M.createEntity(doc, {
      id: id,
      name: name,
      prototypeId: prototypeId || null,
      position: position || null,
      style: style || {}
    });
  }

  function addRelationDefinition(doc, id, name, style) {
    return M.createRelation(doc, { id: id, name: name, style: style || {} });
  }

  function addRelationInstance(doc, id, prototypeId, fromId, fromPort, toId, toPort) {
    return M.createRelation(doc, {
      id: id,
      name: '',
      prototypeId: prototypeId,
      ends: {
        a: M.makeBoundEnd(fromId, fromPort),
        b: M.makeBoundEnd(toId, toPort)
      }
    });
  }

  function taxonomy() {
    const doc = M.createDocument('分类树示例');
    addEntity(doc, 'n_tax_root', '生物', null, null, { fill: '#eef5ff', border: '#5b8def' });
    addEntity(doc, 'n_tax_mammal', '哺乳纲', 'n_tax_root', { x: 360, y: 60 });
    addEntity(doc, 'n_tax_canid', '犬科', 'n_tax_mammal', { x: 160, y: 220 });
    addEntity(doc, 'n_tax_felid', '猫科', 'n_tax_mammal', { x: 560, y: 220 });
    addEntity(doc, 'n_tax_wolf', '狼', 'n_tax_canid', { x: 40, y: 380 });
    addEntity(doc, 'n_tax_fox', '狐', 'n_tax_canid', { x: 260, y: 380 });
    addEntity(doc, 'n_tax_tiger', '虎', 'n_tax_felid', { x: 560, y: 380 });
    addRelationDefinition(doc, 'r_tax_def', '包含', { color: '#5b8def' });
    addRelationInstance(doc, 'r_tax_1', 'r_tax_def', 'n_tax_mammal', 'bottom', 'n_tax_canid', 'top');
    addRelationInstance(doc, 'r_tax_2', 'r_tax_def', 'n_tax_mammal', 'bottom', 'n_tax_felid', 'top');
    addRelationInstance(doc, 'r_tax_3', 'r_tax_def', 'n_tax_canid', 'bottom', 'n_tax_wolf', 'top');
    addRelationInstance(doc, 'r_tax_4', 'r_tax_def', 'n_tax_canid', 'bottom', 'n_tax_fox', 'top');
    addRelationInstance(doc, 'r_tax_5', 'r_tax_def', 'n_tax_felid', 'bottom', 'n_tax_tiger', 'top');
    return doc;
  }

  function techTree() {
    const doc = M.createDocument('科技树示例');
    addEntity(doc, 'n_tech_root', '科技', null, null, { fill: '#f0fdf4', border: '#059669' });
    addEntity(doc, 'n_tech_tools', '基础工具', 'n_tech_root', { x: 60, y: 220 });
    addEntity(doc, 'n_tech_fire', '用火', 'n_tech_root', { x: 260, y: 120 });
    addEntity(doc, 'n_tech_farm', '农业', 'n_tech_root', { x: 260, y: 340 });
    addEntity(doc, 'n_tech_pottery', '陶器', 'n_tech_root', { x: 480, y: 60 });
    addEntity(doc, 'n_tech_metal', '冶金', 'n_tech_root', { x: 480, y: 200 });
    addEntity(doc, 'n_tech_herd', '畜牧', 'n_tech_root', { x: 480, y: 360 });
    addEntity(doc, 'n_tech_writing', '文字', 'n_tech_root', { x: 700, y: 60 });
    addEntity(doc, 'n_tech_wheel', '轮子', 'n_tech_root', { x: 700, y: 360 });
    addRelationDefinition(doc, 'r_tech_def', '解锁', { color: '#059669' });
    addRelationInstance(doc, 'r_tech_1', 'r_tech_def', 'n_tech_tools', 'right', 'n_tech_fire', 'left');
    addRelationInstance(doc, 'r_tech_2', 'r_tech_def', 'n_tech_tools', 'right', 'n_tech_farm', 'left');
    addRelationInstance(doc, 'r_tech_3', 'r_tech_def', 'n_tech_fire', 'right', 'n_tech_pottery', 'left');
    addRelationInstance(doc, 'r_tech_4', 'r_tech_def', 'n_tech_fire', 'right', 'n_tech_metal', 'left');
    addRelationInstance(doc, 'r_tech_5', 'r_tech_def', 'n_tech_farm', 'right', 'n_tech_herd', 'left');
    addRelationInstance(doc, 'r_tech_6', 'r_tech_def', 'n_tech_herd', 'right', 'n_tech_wheel', 'left');
    addRelationInstance(doc, 'r_tech_7', 'r_tech_def', 'n_tech_pottery', 'right', 'n_tech_writing', 'left');
    return doc;
  }

  function foodChain() {
    const doc = M.createDocument('食物链示例');
    addEntity(doc, 'n_food_root', '物种', null, null, { fill: '#fff7ed', border: '#d97706' });
    addEntity(doc, 'n_food_tiger', '虎', 'n_food_root', { x: 340, y: 40 });
    addEntity(doc, 'n_food_fox', '狐', 'n_food_root', { x: 140, y: 180 });
    addEntity(doc, 'n_food_eagle', '鹰', 'n_food_root', { x: 540, y: 180 });
    addEntity(doc, 'n_food_rabbit', '兔', 'n_food_root', { x: 60, y: 320 });
    addEntity(doc, 'n_food_mouse', '鼠', 'n_food_root', { x: 460, y: 320 });
    addEntity(doc, 'n_food_grass', '草', 'n_food_root', { x: 260, y: 460 });
    addRelationDefinition(doc, 'r_food_def', '捕食', { color: '#d97706', lineStyle: 'straight' });
    addRelationInstance(doc, 'r_food_1', 'r_food_def', 'n_food_tiger', 'bottom', 'n_food_fox', 'top');
    addRelationInstance(doc, 'r_food_2', 'r_food_def', 'n_food_tiger', 'bottom', 'n_food_eagle', 'top');
    addRelationInstance(doc, 'r_food_3', 'r_food_def', 'n_food_fox', 'bottom', 'n_food_rabbit', 'top');
    addRelationInstance(doc, 'r_food_4', 'r_food_def', 'n_food_fox', 'bottom', 'n_food_mouse', 'top');
    addRelationInstance(doc, 'r_food_5', 'r_food_def', 'n_food_eagle', 'bottom', 'n_food_mouse', 'top');
    addRelationInstance(doc, 'r_food_6', 'r_food_def', 'n_food_rabbit', 'bottom', 'n_food_grass', 'top');
    addRelationInstance(doc, 'r_food_7', 'r_food_def', 'n_food_mouse', 'bottom', 'n_food_grass', 'top');
    return doc;
  }

  function timeline() {
    const doc = M.createDocument('时间线示例');
    addEntity(doc, 'n_time_root', '阶段', null, null, { fill: '#f5f3ff', border: '#7c3aed' });
    addEntity(doc, 'n_time_plan', '立项', 'n_time_root', { x: 340, y: 40 });
    addEntity(doc, 'n_time_need', '需求', 'n_time_root', { x: 340, y: 200 });
    addEntity(doc, 'n_time_dev', '开发', 'n_time_root', { x: 340, y: 360 });
    addEntity(doc, 'n_time_test', '测试', 'n_time_root', { x: 340, y: 520 });
    addEntity(doc, 'n_time_launch', '上线', 'n_time_root', { x: 340, y: 680 });
    addRelationDefinition(doc, 'r_time_def', '下一步', { color: '#7c3aed', lineStyle: 'straight' });
    addRelationInstance(doc, 'r_time_1', 'r_time_def', 'n_time_plan', 'bottom', 'n_time_need', 'top');
    addRelationInstance(doc, 'r_time_2', 'r_time_def', 'n_time_need', 'bottom', 'n_time_dev', 'top');
    addRelationInstance(doc, 'r_time_3', 'r_time_def', 'n_time_dev', 'bottom', 'n_time_test', 'top');
    addRelationInstance(doc, 'r_time_4', 'r_time_def', 'n_time_test', 'bottom', 'n_time_launch', 'top');
    return doc;
  }

  function migration() {
    const doc = M.createDocument('人类迁徙示例');
    addEntity(doc, 'n_mig_root', '人群', null, null, { fill: '#ecfeff', border: '#0891b2' });
    addEntity(doc, 'n_mig_africa', '非洲起源', 'n_mig_root', { x: 80, y: 420 });
    addEntity(doc, 'n_mig_westasia', '西亚', 'n_mig_root', { x: 280, y: 320 });
    addEntity(doc, 'n_mig_europe', '欧洲', 'n_mig_root', { x: 320, y: 160 });
    addEntity(doc, 'n_mig_southasia', '南亚', 'n_mig_root', { x: 500, y: 380 });
    addEntity(doc, 'n_mig_eastasia', '东亚', 'n_mig_root', { x: 720, y: 300 });
    addEntity(doc, 'n_mig_northasia', '北亚', 'n_mig_root', { x: 720, y: 120 });
    addEntity(doc, 'n_mig_america', '美洲', 'n_mig_root', { x: 940, y: 160 });
    addRelationDefinition(doc, 'r_mig_def', '迁徙', { color: '#0891b2' });
    addRelationInstance(doc, 'r_mig_1', 'r_mig_def', 'n_mig_africa', 'right', 'n_mig_westasia', 'left');
    addRelationInstance(doc, 'r_mig_2', 'r_mig_def', 'n_mig_westasia', 'top', 'n_mig_europe', 'bottom');
    addRelationInstance(doc, 'r_mig_3', 'r_mig_def', 'n_mig_westasia', 'right', 'n_mig_southasia', 'left');
    addRelationInstance(doc, 'r_mig_4', 'r_mig_def', 'n_mig_southasia', 'right', 'n_mig_eastasia', 'left');
    addRelationInstance(doc, 'r_mig_5', 'r_mig_def', 'n_mig_eastasia', 'top', 'n_mig_northasia', 'bottom');
    addRelationInstance(doc, 'r_mig_6', 'r_mig_def', 'n_mig_northasia', 'right', 'n_mig_america', 'left');
    return doc;
  }

  return {
    list: [
      { id: 'taxonomy', name: '分类树', desc: '生物分类层级：哺乳纲下分犬科、猫科及具体物种', icon: '🧬', tone: '#5b8def', build: taxonomy },
      { id: 'tech-tree', name: '科技树', desc: '从基础工具解锁用火、农业，再延伸到冶金、畜牧与文字', icon: '⚙️', tone: '#059669', build: techTree },
      { id: 'food-chain', name: '食物链', desc: '猎物在下、顶级掠食者在上，箭头由掠食者指向猎物', icon: '🔗', tone: '#d97706', build: foodChain },
      { id: 'timeline', name: '时间线', desc: '立项到上线的项目阶段，自上而下排列', icon: '🕒', tone: '#7c3aed', build: timeline },
      { id: 'migration', name: '人类迁徙', desc: '人类从非洲起源，经西亚扩散到欧洲、亚洲，再经北亚进入美洲', icon: '🌍', tone: '#0891b2', build: migration }
    ]
  };
});
