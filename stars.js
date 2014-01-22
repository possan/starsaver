(function() {

	var Stars = function() {
		this.settings = {
			randomseed: 12345,
			originX: 0,
			originY: 0,
			originZ: 0,
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
				this.overrideConfig(tmp);
			}
		}
	}

	Stars.prototype.overrideConfig = function(obj) {
		for(k in obj) {
			this.settings[k] = obj[k];
		}
	}

	Stars.prototype.init = function() {
		console.log('init');

		// defaults are initialized, load settings
		this.loadConfig();

		// load websaver overrides
		if (window.saver) {
		}
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
		var timeLocation = gl.getUniformLocation(program, "time");

		var worldmatrixLocation = gl.getUniformLocation(program, "worldmatrix");
		var projectionmatrixLocation = gl.getUniformLocation(program, "projmatrix");

		dataTexture = gl.createTexture();

		var numstars = 5000;

		var t = [];
		var t2 = [];
		for(var i=0; i<numstars; i++) {
			var bx = -100.0 + (Math.random() * 200.0);
			var by = -100.0 + (Math.random() * 200.0);
			var bz = -100.0 + (Math.random() * 200.0);

			// bx = 100 * Math.sin(i / 350.0);
			// by = 100 * Math.cos(i / 140.0);
			bz = 200 * (i / numstars) - 100;

			var r = 0.0;//1 + Math.random() * 0.02;

			t = t.concat([
				bx - r,  by - r,  bz + 0.0, 0.0,
				bx + r,  by - r,  bz + 0.0, 0.0,
				bx - r,  by + r,  bz + 0.0, 0.0,
				bx - r,  by + r,  bz + 0.0, 0.0,
				bx + r,  by - r,  bz + 0.0, 0.0,
				bx + r,  by + r,  bz + 0.0, 0.0
			]);

			t2 = t2.concat([
				0, 0,
				1, 0,
				0, 1,
				0, 1,
				1, 0,
				1, 1
			])
		}

		// Create a buffer and put a single clipspace rectangle in
		// it (2 triangles)
		var buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(t), gl.STATIC_DRAW);
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
        var projmatrix = mat4.create();
        var tmpmatrix = mat4.create();

	    function renderFrame() {
	        gl.uniform1f(timeLocation, time);

	        mat4.identity(worldmatrix);
	        mat4.rotate(worldmatrix, tmpmatrix,   time / 1.4, [1, 0, 0]);
	        mat4.rotate(tmpmatrix,   worldmatrix, time / 1.7, [0, 1, 0]);
	        mat4.rotate(worldmatrix, tmpmatrix,   time / 1.4, [0, 0, 1]);

	        mat4.identity(projmatrix);
			mat4.perspective(tmpmatrix, 100, window.innerWidth/window.innerHeight, 5, 50000);
			mat4.translate(projmatrix, tmpmatrix, [0, 0, 0])
			// console.log(projmatrix);

	        gl.uniformMatrix4fv(worldmatrixLocation, false, worldmatrix);
	        gl.uniformMatrix4fv(projectionmatrixLocation, false, projmatrix);

		    // gl.activeTexture(gl.TEXTURE0);
			// gl.bindTexture(gl.TEXTURE_2D, dataTexture);
			// gl.uniform1i(gl.getUniformLocation(program, "specSampler"), 0);

	        gl.drawArrays(gl.TRIANGLES, 0, numstars * 6);
	        time += 1.0 / 60.0;
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
	}

	var g_stars = new Stars();
	g_stars.init();
	g_stars.start();

})();
