(function() {

	var Stars = function() {
		this.settings = {
			randomseed: 12345,
			originX: 0,
			originY: 0,
			originZ: 0,
			viewX: 0,
			viewY: 0,
			viewZ: 0,
			forwardX: 0,
			forwardY: 0,
			forwardZ: 1,
			upX: 0,
			upY: 1,
			upZ: 0,
			fov: 100,
			screenWidth: 0,
			screenHeight: 0,
			screenOffsetX: 0,
			screenOffsetY: 0,
			timeOffset: 0
		};
		this.startTime = 0;
		this.frame = 0;
		this.loading = true;
		this.environment = {};
	}

	Stars.prototype.start = function() {
		if (this.initGL()) {
			this.renderFrame();
		}
	}

	Stars.prototype.saveConfig = function() {
		localStorage.setItem("stars", JSON.stringify(this.settings));
	}

	Stars.prototype.loadConfig = function() {
		var tmp = localStorage.getItem("stars");
		if (tmp) {
			tmp = JSON.parse(tmp);
			if (tmp) {
				for(k in tmp) {
					this.settings[k] = tmp[k];
				}
			}
		}
	}

	Stars.prototype.parseArray = function(str, len) {
		var ret = new Array(len);
		var spl = str.split(',');
		for(var i=0; i<len; i++) {
			ret[i] = 0.0;
			try {
				var f = parseFloat(spl[i]);
				ret[i] = f;
			} catch(e) {
			}
		}
		console.log('parseArray', str, ret);
		return ret;
	}

	Stars.prototype.buildString = function(dummy) {
		var ret = new Array(arguments.length);
		ret = [];
		for(var i=0; i<arguments.length; i++)
			ret.push(arguments[i].toString());
		ret = ret.join(', ');
		console.log('buildString', arguments, ret);
		return ret;
	}

	Stars.prototype.appOverride = function(obj) {
		if (obj.forwardvector) {
			var a = this.parseArray(obj.forwardvector, 3);
			this.settings.forwardX = a[0];
			this.settings.forwardY = a[1];
			this.settings.forwardZ = a[2];
		}
		if (obj.upvector) {
			var a = this.parseArray(obj.upvector, 3);
			this.settings.upX = a[0];
			this.settings.upY = a[1];
			this.settings.upZ = a[2];
		}
		if (obj.viewoffset) {
			var a = this.parseArray(obj.viewoffset, 3);
			this.settings.viewX = a[0];
			this.settings.viewY = a[1];
			this.settings.viewZ = a[2];
		}
	}

	Stars.prototype.init = function() {
		this.loadConfig();
		this.initConfigForm();
	}

	Stars.prototype.initConfigForm = function() {
		var self = this;

		var f1 = document.getElementById('forwardvectorfield');
		f1.value = self.buildString(self.settings.forwardX, self.settings.forwardY, self.settings.forwardZ);
		var save_f1 = function() {
			// save field value
			var a = self.parseArray(f1.value, 3);
			self.settings.forwardX = a[0];
			self.settings.forwardY = a[1];
			self.settings.forwardZ = a[2];
			self.saveConfig();
		}
		f1.addEventListener('change', save_f1);
		f1.addEventListener('keyup', save_f1);

		var f2 = document.getElementById('upvectorfield');
		f2.value = self.buildString(self.settings.upX, self.settings.upY, self.settings.upZ);
		var save_f2 = function() {
			// save field value
			var a = self.parseArray(f2.value, 3);
			self.settings.upX = a[0];
			self.settings.upY = a[1];
			self.settings.upZ = a[2];
			self.saveConfig();
		}
		f2.addEventListener('change', save_f2);
		f2.addEventListener('keyup', save_f2);

		var f3 = document.getElementById('viewoffsetfield');
		f3.value = self.buildString(self.settings.viewX, self.settings.viewY, self.settings.viewZ);
		var save_f3 = function() {
			// save field value
			var a = self.parseArray(f3.value, 3);
			self.settings.viewX = a[0];
			self.settings.viewY = a[1];
			self.settings.viewZ = a[2];
			self.saveConfig();
		}
		f3.addEventListener('change', save_f3);
		f3.addEventListener('keyup', save_f3);

		var f4 = document.getElementById('closecontrols');
		f4.addEventListener('click', function() {
			document.getElementById('controls').style.display = 'none';
		});

		document.body.addEventListener('keydown', function(e) {
			console.log(e);
			if (e.keyCode == 67) {
				// "C"
				document.getElementById('controls').style.display = 'block';
			}
			if (e.keyCode == 68) {
				// "D"
				document.getElementById('debug').style.display = 'block';
			}
		});
	}

	Stars.prototype.initGL = function() {
		var canvas = document.getElementById("canvas");
		var gl = getWebGLContext(canvas);
		if (!gl) {
			return false;
		}

		// setup GLSL program
		vertexShader = createShaderFromScriptElement(gl, "2d-vertex-shader");
		fragmentShader = createShaderFromScriptElement(gl, "2d-fragment-shader");
		program = createProgram(gl, [vertexShader, fragmentShader]);
		gl.useProgram(program);

		// look up where the vertex data needs to go.
		var positionLocation = gl.getAttribLocation(program, "position");
		var uvLocation = gl.getAttribLocation(program, "uv");

		var resolutionLocation = gl.getUniformLocation(program, "resolution");
		var localTimeLocation = gl.getUniformLocation(program, "localTime");
		var globalTimeLocation = gl.getUniformLocation(program, "globalTime");

		var worldmatrixLocation = gl.getUniformLocation(program, "worldmatrix");
		var viewmatrixLocation = gl.getUniformLocation(program, "viewmatrix");
		var projectionmatrixLocation = gl.getUniformLocation(program, "projmatrix");

		dataTexture = gl.createTexture();

		var numstars = 7000;

		var t1 = new Array(numstars * 4 * 6);
		var t2 = new Array(numstars * 2 * 6);

		Math.seedrandom('Starfield unicorns');

		var t1o = 0;
		var t2o = 0;

		for(var i=0; i<numstars; i++) {
			var bx = -100.0 + (Math.random() * 200.0);
			var by = -100.0 + (Math.random() * 200.0);
			var bz = -100.0 + (Math.random() * 200.0);

		//	by = 10 * Math.sin((0.0+i) / 105.0);
		// 	bx = 10 * Math.cos((0.0+i) / 938.0);
			bz = (i / numstars) * 200 - 100;

			var r = 0.0;

			t1[t1o ++] = bx - r;
			t1[t1o ++] = by - r;
			t1[t1o ++] = bz + 0.0;
			t1[t1o ++] = 0.0;
			t2[t2o ++] = 0;
			t2[t2o ++] = 0;

			t1[t1o ++] = bx + r;
			t1[t1o ++] = by - r;
			t1[t1o ++] = bz + 0.0;
			t1[t1o ++] = 0.0;
			t2[t2o ++] = 1;
			t2[t2o ++] = 0;

			t1[t1o ++] = bx - r;
			t1[t1o ++] = by + r;
			t1[t1o ++] = bz + 0.0;
			t1[t1o ++] = 0.0;
			t2[t2o ++] = 0;
			t2[t2o ++] = 1;

			t1[t1o ++] = bx - r;
			t1[t1o ++] = by + r;
			t1[t1o ++] = bz + 0.0;
			t1[t1o ++] = 0.0;
			t2[t2o ++] = 0;
			t2[t2o ++] = 1;

			t1[t1o ++] = bx + r;
			t1[t1o ++] = by - r;
			t1[t1o ++] = bz + 0.0;
			t1[t1o ++] = 0.0;
			t2[t2o ++] = 1;
			t2[t2o ++] = 0;

			t1[t1o ++] = bx + r;
			t1[t1o ++] = by + r;
			t1[t1o ++] = bz + 0.0;
			t1[t1o ++] = 0.0
			t2[t2o ++] = 1;
			t2[t2o ++] = 1
		}

		var buffer1 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(t1), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 4, gl.FLOAT, false, 0, 0);

		var buffer2 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(t2), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(uvLocation);
		gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

		var time = 0.0;

		function resize() {
			var w = window.innerWidth;
			var h = window.innerHeight;
			console.log('resize', w, h);
			canvas.width = w;
			canvas.height = h;
			gl.uniform2f(resolutionLocation, w, h);
			gl.viewport(0, 0, w, h);
		}

		function mousemove(e) {
			var w = window.innerWidth;
			var h = window.innerHeight;
			gl.uniform2f(mouseLocation, e.offsetX / w, e.offsetY / h);
		}

		var worldmatrix = mat4.create();
		var viewmatrix = mat4.create();
		var projmatrix = mat4.create();
		var tmpmatrix = mat4.create();
		var tmpmatrix2 = mat4.create();
		var tmpmatrix3 = mat4.create();
		var tmpmatrix4 = mat4.create();
		var tmpmatrix5 = mat4.create();
		var tmpmatrix6 = mat4.create();

		var startTime = ((new Date()).getTime() / 1000.0);
		var globalTimeOffset = ((new Date()).getTime() / 1000.0) % 100000.0;
		console.log('global time offset', globalTimeOffset);

		var self = this;

		function renderFrame() {

			time = ((new Date()).getTime() / 1000.0) - startTime;

			var gtime = time + globalTimeOffset;
			gl.uniform1f(globalTimeLocation, gtime);
			gl.uniform1f(localTimeLocation, time);

			document.getElementById('debug').innerText = Math.round(gtime) + ' s.';

			var u = [self.settings.upX, self.settings.upY, self.settings.upZ];
			vec3.normalize(u, u);

			var f = [self.settings.forwardX, self.settings.forwardY, self.settings.forwardZ];
			vec3.normalize(f, f);

			mat4.identity(worldmatrix);
			mat4.identity(viewmatrix);
			mat4.identity(tmpmatrix);
			mat4.identity(tmpmatrix2);
			mat4.identity(tmpmatrix3);
			mat4.identity(tmpmatrix4);
			mat4.identity(tmpmatrix5);
			mat4.identity(tmpmatrix6);

			mat4.rotate(tmpmatrix2, tmpmatrix, gtime / 12.4, [1, 0, 0]);
			mat4.rotate(tmpmatrix3, tmpmatrix, gtime / 9.7, [0, 1, 0]);
			mat4.rotate(tmpmatrix4, tmpmatrix, gtime / 8.0, [0, 0, 1]);

			var sc = -30.0, sc2 = 5.0;
			mat4.lookAt(viewmatrix,
				[
					self.settings.viewX * sc - f[0] * sc2,
					self.settings.viewY * sc - f[1] * sc2,
					self.settings.viewZ * sc - f[2] * sc2
				],
				[
					self.settings.viewX * sc,
					self.settings.viewY * sc,
					self.settings.viewZ * sc
				],
				[
					u[0] * sc2,
					u[1] * sc2,
					u[2] * sc2
				]
			);

			mat4.multiply(worldmatrix, worldmatrix, tmpmatrix2);
			mat4.multiply(worldmatrix, worldmatrix, tmpmatrix3);
			mat4.multiply(worldmatrix, worldmatrix, tmpmatrix4);

			mat4.identity(projmatrix);
			mat4.identity(tmpmatrix3);
			mat4.perspective(tmpmatrix3, 45, window.innerWidth/window.innerHeight, 1, 1000);
			mat4.multiply(projmatrix, projmatrix, tmpmatrix3);

			// console.log(worldmatrix);

			gl.uniformMatrix4fv(worldmatrixLocation, false, worldmatrix);
			gl.uniformMatrix4fv(viewmatrixLocation, false, viewmatrix);
			gl.uniformMatrix4fv(projectionmatrixLocation, false, projmatrix);

			gl.depthMask(false);
			gl.disable(gl.DEPTH_TEST);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE, gl.ONE);
			gl.drawArrays(gl.TRIANGLES, 0, numstars * 6);
		   // time += 1.0 / 60.0;
			requestAnimFrame(renderFrame);
		}

		resize();
		requestAnimFrame(renderFrame);

		return true;
	}

	Stars.prototype.renderFrame = function() {
		// console.log('render frame');

		this.frame += 1.0 / 60.0;
		requestAnimationFrame(this.renderFrame.bind(this));

		if (this.loading) {
			this.loading = false;
			document.getElementById('loading').style.display = 'none';
		}
	}

	window.starfield = new Stars();

	window.starfield.init();

	window.starfield.start();

	console.log('location', location);
	if (location.hash && location.hash != '') {
		window.starfield.appOverride(JSON.parse(location.hash.substring(1)));
	}

	/*
	window.starfield.appOverride({
		viewoffset: '0,1,2',
		upvector: '0,1,0',
		forwardvector: '0,0,1'
	});
	*/

})();
