(function(){
	//canvas
	var cnv = document.querySelector('canvas');
	//contexto de renderização 2d
	var ctx = cnv.getContext('2d');
	
	//RECURSOS DO JOGO ========================================================>
	//arrays
	var sprites = [];
	var assetsToLoad = [];
	var missiles = [];
	var aliens= [];
	var messages = [];


	//variaveis uteis
	var alienFrequency=100;
	var alienTimer= 0;
	var shots=0;
	var hits=0;
	var acuracy=0;
	var scoreToWin=70;

	
	//sprites
	//cenário
	var background = new Sprite(0,56,400,500,0,0);
	sprites.push(background);

		//nave
		var defender = new Sprite(0,0,30,50,185,450);
		sprites.push(defender);

//mesagens
var startMessage= new ObjectMessage(cnv.height/2,"PRESS ENTER", "#008000");
	messages.push(startMessage);


	// pause
var pausedMessage = new ObjectMessage(cnv.height/2, "PAUSADO","#008000");
pausedMessage.visible=false;
messages.push(pausedMessage);

// game over
var gameOverMessage = new ObjectMessage(cnv.height/2, "", "#f00");
gameOverMessage.visible=false;
messages.push(gameOverMessage);

//placar
var scoreMessage = new ObjectMessage(8,"","#0f0");
scoreMessage.font= "normal bold 10px emulogic";
updateScore();
messages.push(scoreMessage);

	//imagem
	var img = new Image();
	img.addEventListener('load',loadHandler,false);
	img.src = "img/img.png";
	assetsToLoad.push(img);
	//contador de recursos
	var loadedAssets = 0;
	
	
	//entradas
	var LEFT = 37, RIGHT = 39, ENTER = 13, SPACE = 32;
	
	//açoes
	var mvLeft = mvRight = shoot= spaceIsDown= false;
	
	//estados do jogo
	var LOADING = 0, PLAYING = 1, PAUSED = 2, OVER = 3;
	var gameState = LOADING;
	
	//listeners
	window.addEventListener('keydown',function(e){
		var key = e.keyCode;
		switch(key){
			case LEFT:
				mvLeft = true;
				break;
			case RIGHT:
				mvRight = true;
				break;
				case SPACE:
					if(!spaceIsDown){
						shoot= true;
						spaceIsDown= true;
					}
		}
	},false);
	
	window.addEventListener('keyup',function(e){
		var key = e.keyCode;
		switch(key){
			case LEFT:
				mvLeft = false;
				break;
			case RIGHT:
				mvRight = false;
				break;
			case ENTER:
				if(gameState !== OVER){
					if(gameState !== PLAYING){
						gameState = PLAYING;
						startMessage.visible = false;
						pausedMessage.visible=false;
					} else {
						gameState = PAUSED;
						pausedMessage.visible = true;
					}
				}
				
				break;
				case SPACE:
					spaceIsDown= false;
		}
	},false);
	
	
	
	//FUNÇÕES =================================================================>
	function loadHandler(){
		loadedAssets++;
		if(loadedAssets === assetsToLoad.length){
			img.removeEventListener('load',loadHandler,false);
			//inicia o jogo
			gameState = PAUSED;
		}
	}
	
	function loop(){
		requestAnimationFrame(loop, cnv);
		//define as ações com base no estado do jogo
		switch(gameState){
			case LOADING:
				console.log('LOADING...');
				break;
			case PLAYING:
				update();
				break;
				case OVER:
					endGame();
					break;
		}
		render();
	}
	
	function update(){
		//move para a esquerda
		if(mvLeft && !mvRight){
			defender.vx = -5;
		}
		
		//move para a direita
		if(mvRight && !mvLeft){
			defender.vx = 5;
		}
		
		//para a nave
		if(!mvLeft && !mvRight){
			defender.vx = 0;
		}

		//disparos 
		if(shoot){
			fireMissile();
			shoot= false;
		}
		//atualiza a posição
		defender.x = Math.max(0,Math.min(cnv.width - defender.width, defender.x + defender.vx));
		//posição dos misseis
		for(var i in missiles){
			var missile= missiles[i];
			missile.y += missile.vy;
			if(missile.y <  -missile.height){
				removeObjects(missile, missiles);
				removeObjects(missile,sprites);
				updateScore();
				i--;
			}

		}
		//encremento do alienTimer
		alienTimer++;
		//cria alien
		if(alienTimer== alienFrequency){
			makeAlien();
			alienTimer=0;
			// ajuste na frequencia de aliens
			if(alienFrequency>2){
				alienFrequency--;
			}
		}
		//move os aliens
		for(var i in aliens){
			var alien = aliens[i];
			if (alien.state != alien.EXPLODED){
				alien.y += alien.vy;
				if(alien.state === alien.CRAZY){
					if(alien.x > cnv.width - alien.width || alien.x <0){
						alien.vx *= -1;
					}
					alien.x += alien.vx;
				}
			}
			// confere se algum alien chegou a terra
		if(alien.y > cnv.height + alien.height){
			gameState= OVER;
			
		}

		//colisao com a navinha
		if(collide(alien,defender)){
			destroyAlien(alien);
			removeObjects(defender,sprites);
			gameState= OVER;
		}
		//confere se algum alien foi destrido
		for(var j in missiles){
			var missile = missiles[j];
			if(collide(missile, alien) && alien.state !== alien.EXPLODED){
				destroyAlien(alien);
				hits++;
				updateScore();
				if(parseInt(hits) === scoreToWin){
					gameState= OVER;
					for(var k in alien){
						var alienk = alien[k];
						destroyAlien(alienk);
					}
				}
				removeObjects(missile, missiles);
				removeObjects(missile, sprites);
				j--;
				i--;
			}
		}
		}//fim da movimentação dos aliens
		
	}

	// misseis
	function fireMissile(){
		var missile=new Sprite(136,12,8,13, defender.centerX() - 4,defender.y - 13);
		missile.vy = -8;
		sprites.push(missile);
		missiles.push(missile);
		shots++;
	}

	//criação de aliens
	function makeAlien(){
		var alienPosition = (Math.floor(Math.random()*8))*50;

		var alien= new Alien(30,0,50,50,alienPosition,-50);
		alien.vy=1;
		//otimização do alien 
		if(Math.floor (Math.random()*11)> 7){
			alien.state= alien.CRAZY;
			alien.vx=2;
		
		}

		if(Math.floor(Math.random()*11)>5){
			alien.vy =2;
		}

		sprites.push(alien);
		aliens.push(alien);
	}
	// destroi alien
	function destroyAlien(alien){
		alien.state= alien.EXPLODED;
		alien.explode();
		setTimeout(function(){
			removeObjects(alien,aliens);
			removeObjects(alien,sprites);
		},500);
	}

	//destruição dos misseis
	function removeObjects(objectToRemove, array){
		var i = array.indexOf(objectToRemove);
		if(i !== -1){
			array.splice(i,1);
		}
	}
	// update do placar
	function updateScore(){
		if(shots === 0){
			acuracy = 100;
		}else{
			acuracy= Math.floor((hits/shots)*100);
		}
		if(acuracy < 100){
			acuracy = acuracy.toString();
			if(acuracy.length < 2){
				acuracy = "  "+ acuracy;
			}else{
				acuracy = "  "+ acuracy;
			}
			hits = hits.toString();
			if(hits.length < 2){
				hits= "0" + hits;
			}
		}
		scoreMessage.text= "HITS: " +hits+ " - ACURACY: "+ acuracy+ "%"
	}

	//função de game over
	function endGame(){
		if(hits < scoreToWin){
			gameOverMessage.text= "Voce Morreu";
			gameOverMessage.color= "#f00"
		}else{
			gameOverMessage.text = "Voce Ganhou";
			gameOverMessage.color= "#008000";
		}
		gameOverMessage.visible= true;
		setTimeout(function(){
			location.reload();
		},3000)
	}
	function render(){
		ctx.clearRect(0,0,cnv.width,cnv.height);
		//Exibe sprites
		if(sprites.length !== 0){
			for(var i in sprites){
				var spr = sprites[i];
				ctx.drawImage(img,spr.sourceX,spr.sourceY,spr.width,spr.height,Math.floor(spr.x),Math.floor(spr.y),spr.width,spr.height);
			}
		}
		// exibe os textos
		if(messages.length !== 0){
			for(var i in messages){
				var message = messages[i];
				if(message.visible){
					ctx.font= message.font;
					ctx.fillStyle= message.color;
					ctx.textBaseline= message.balseline;
					message.x= (cnv.width - ctx.measureText(message.text). width)/2;
					ctx.fillText(message.text, message.x, message.y);
				}

			}
		}
	}
	
	loop();
	
}());
