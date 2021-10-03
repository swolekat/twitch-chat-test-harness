(() => {
	const getBadgesString = detail => detail?.badges|| '';

	const classFromObjMap = {
		'mod': (detail) => {
			return detail.mod !== '0';
		},
		'sub': (detail) => {
			return detail.subscriber !== '0';
		},
		'vip': (detail) => {
			return getBadgesString(detail).includes('vip/1');
		},
		'founder': (detail) => {
			return getBadgesString(detail).includes('found/0');
		},
		'prime': (detail) => {
			return getBadgesString(detail).includes('premium');
		},
		'owner': (detail) => {
			return detail.owner;
		},
	};


	// Please use event listeners to run functions.
	document.addEventListener('onLoad', function(obj) {
		// obj will be empty for chat widget
		// this will fire only once when the widget loads
	});

	document.addEventListener('onEventReceived', function(obj) {
		// obj will contain information about the event
		// by setting the timeout to 0 we should be able to guarantee the message has been rendered
		setTimeout(() => {
			const {detail} = obj;
			if(!detail){
				return;
			}
			const id = detail?.tags?.id;
			const classes = Object.keys(classFromObjMap).filter(className => classFromObjMap[className](detail)).join(' ');
			const messagesByUser = document.querySelectorAll(`[data-id="${id}"]`);
			if(!messagesByUser){
				return;
			}
			messagesByUser.forEach(message => {
				if(message.className.includes('already-done')){
					return;
				}

				const color = message.getAttribute('data-color');

				if(classes === ''){
					message.className = `${message.className} already-done`;
					message.style = `background: ${color}`;
					return;
				}
				message.className = `already-done ${classes}`;
				message.style = `color: ${color}`;
			});
		}, 0);
	});
})();

