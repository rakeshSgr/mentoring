module.exports = {
	apps: [
		{
			name: 'mentored-mentoring',
			script: './app.js',
			watch: ['./'],
			watch_delay: 100,
			ignore_watch: ['node_modules', 'client/img', '\\.git', '*.log'],
		},
	],
}
