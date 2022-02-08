(function(){
	if(!window.idToClassMap){
		window.idToClassMap = {};
	}

	var botIds = [
		541450924, //creatisbot
		1564983,   //moobot
		120560983, //warpworldbot
		100135110, //streamelements
	];

	var getBadgesString = function(detail) {
		return detail.tags.badges || '';
	};

	var classFromObjMap = {
		'mod': function(detail) {
			return getBadgesString(detail).indexOf('moderator/1') !== -1;
		},
		'sub': function(detail) {
			return !!detail.subscriber && detail.subscriber !== '0';
		},
		'vip': function(detail) {
			return getBadgesString(detail).indexOf('vip/') !== -1;
		},
		'founder': function(detail) {
			return getBadgesString(detail).indexOf('founder/') !== -1;
		},
		'prime': function(detail)  {
			return getBadgesString(detail).indexOf('premium') !== -1;
		},
		'owner': function(detail) {
			return detail.owner;
		},
		'bot': function(detail) {
			return botIds.indexOf(Number.parseInt(detail.tags['user-id'], 10)) !== -1;
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
			var detail = obj.detail;
			if(!detail || !detail.tags){
				return;
			}
			var id = detail.tags.id;
			var userId = detail.tags['user-id'];
			console.log(JSON.stringify(detail.tags));
			var classes = Object.keys(classFromObjMap).filter(function(className) { return classFromObjMap[className](detail)}).join(' ');
			if(idToClassMap[userId]){
				classes = classes + ' ' + idToClassMap[userId];
			}
			var messagesByUser = document.querySelectorAll('[data-id="'+id+'"]');
			if(!messagesByUser){
				return;
			}
			messagesByUser.forEach(function(message) {
				if(message.className.indexOf('already-done') !== -1){
					return;
				}

				var color = message.getAttribute('data-color')
				message.setAttribute('data-badges', getBadgesString(detail));

				if(classes === ''){
					message.className = message.className+ ' already-done';
					const backgroundImage = message.querySelector('.background-image');
					backgroundImage.style.background = color;
					return;
				}
				message.className = 'already-done '+classes;
				message.style = 'color: '+ color;
			});
		}, 0);
	});
})();

