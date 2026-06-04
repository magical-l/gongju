export default [
	{
		name: '金属',
		symbol:'',
		filterable: true,
		children: [
			{
				name: '碱金属',
				filterable: true
			},
			{
				name: '碱土金属',
				filterable: true
			},
			{
				name: '过渡金属',
				filterable: true
			},
			{
				name: '贫金属',
				filterable: true
			},
			{
				name: '贵金属',
				symbol:'💰', 
				filterable: true
			},
		]
	},
	{
		name: '类金属',
		filterable: true
	},
	{
		name: '活泼非金属',
		filterable: true
	},
	{
		name: '稀有气体',
		filterable: true
	},
	{
		name: '放射性',
		symbol:'☢️',
		filterable: true
	},
	{
		name: '人造元素',
		symbol:'🫴',
		filterable: true
	},
	{
		name: '稀土',
		filterable: true
	},
	{
		name: '铁磁性',
		symbol: '🧲',
		filterable: true
	},
	{
		name: '卤素',
		filterable: true
	},
	{
		name: '物态',
		children: [
			{
				name: '气态',
				symbol:'🌀',
				filterable: true
			},
			{
				name: '液态',
				symbol:'💧',
				filterable: true
			},
			{
				name: '固态',
				symbol:'🪨',
				filterable: true
			},
		]
	}
];