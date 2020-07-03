const get_map_width = function(xml) {
	let map_width = xml.match(/<P L="(\d+)"/);
	if (map_width) {
		map_width = Number(map_width[1]);
	}
	return map_width || 800;
}

const read_xml_grounds = function(xml) {
	let grounds = [];

	let re = /<S (.*?)\/>/g;
	let m;
	do {
	    m = re.exec(xml);
	    if (m) {
	        grounds.push(m[1]);
	    }
	} while (m);

	return grounds;
}

const read_xml_objects = function(xml) {
	let objects = [];

	let re = /<([FT]|DS) (.*?)\/>/g;
	let m;
	do {
	    m = re.exec(xml);
	    if (m) {
	        objects.push({type: m[1], attr: m[2]});
	    }
	} while (m);
	
	return objects;
}

const reverse_element_coord = function(map_width, element) {
	let preview;

	let x = Number(element.match(/X="(-?\d+)"/)[1]);
	if (x) {
		preview = 'X="{x}"'.format({x: x});
		x = 'X="{x}"'.format({x: (map_width - x)});
	}

	return [preview, x];
}

const reverse_ground_angle = function(ground) {
	let result;

	let properties = ground.match(/P="(.*?)"/);
	if (properties) {
		let _properties = properties[1].split(",");
		let angle = Number(_properties[4]); // By default, the index of angles is always 4
		if (angle != NaN) {
			_properties[4] = -angle;
		}
		result = 'P="{properties}"'.format({properties: _properties.join()});
	}

	return result;
}

const reverse_xml = function(xml) {
	if (xml) {
		// Replacing empty commas with zero to avoid match conflicts
		xml = xml.replace(/,,/g, ",0,").replace(/,,/g, ",0,");
		xml = xml.replace(/P=",/g, 'P="0,');
		xml = xml.replace(/,"/g, ',0"');

		let map_width = get_map_width(xml);

		let grounds_data = read_xml_grounds(xml);
		if (grounds_data.length > 1) { // The length of this array is always 1 if no ground is found in XML
			let grounds_data_str = "";
			for (let i = 0; i < grounds_data.length; i++) {
				let ground_data = grounds_data[i];
				let [prev_x, new_x] = reverse_element_coord(map_width, ground_data);
				let new_properties = reverse_ground_angle(ground_data);
				if (prev_x && new_x) {
					ground_data = ground_data.replace(prev_x, new_x);
				}
				if (new_properties) {
					ground_data = ground_data.replace(/P=".*?"/, new_properties);
				}

				grounds_data_str = grounds_data_str + "<S {attr}/>".format({attr: ground_data});
			}
			xml = xml.replace(/<S>.*?<\/S>/, "<S>{grounds}</S>".format({grounds: grounds_data_str}));
		}

		let objects_data = read_xml_objects(xml);
		if (objects_data.length > 0) {
			let objects_data_str = "";
			for (let i = 0; i < objects_data.length; i++) {
				let object_data = objects_data[i].attr;
				let [prev_x, new_x] = reverse_element_coord(map_width, object_data);
				if (prev_x && new_x) {
					object_data = object_data.replace(prev_x, new_x);
				}
				
				objects_data_str = objects_data_str + "<{type} {attr}/>".format({type: objects_data[i].type, attr: object_data});
			}
			xml = xml.replace(/<D>.*?<\/D>/, "<D>{objects}</D>".format({objects: objects_data_str}));
		}
		
		return xml;
	}

	return;
}

// String adaptation
String.prototype.format = function(placeholders) {
	let s = this;
	for (let property_name in placeholders) {
	    let re = new RegExp("{" + property_name + "}", "gm");
	    s = s.replace(re, placeholders[property_name]);
	}    
	return s;
};
