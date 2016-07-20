function resumeDirective($sce, $compile){
    
    function link(scope, elem, attrs){        
        
        // request frame animation
        (function () {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

        // define platformer
        var Platformer = (function(){
            
            // GLOBAL METHODS
            
            var runAnimation = function(frameFunc){
                var lastTime = null;
                function frame(time){
                    var stop = false;
                    if(lastTime != null){
                        var timeStep = Math.min(time - lastTime, 100) / 1000;
                        stop = frameFunc(timeStep) === false;
                    }
                    lastTime = time;
                    if(!stop){
                        requestAnimationFrame(frame);
                    }
                }
                requestAnimationFrame(frame);
            };
            var inherit = function(proto){
                function F(){}
                F.prototype = proto;
                return new F;
            };
            var extend = function(Child, Parent, type){
                Child.prototype = inherit(Parent.prototype);
                Child.prototype.constructor = Child;
                Child.parent = Parent.prototype;
                Child.type = type;
            };
            var intersectRect = function (r1, r2) {
              return !(r2.left > r1.right || 
                       r2.right < r1.left || 
                       r2.top > r1.bottom ||
                       r2.bottom < r1.top);
            };
            var tilesToPixels = function(tiles){
                return tiles * tileSize;
            }
            var pixelsToTiles = function(pixels){
                return parseInt(pixels / tileSize);
            }

            
            // AUTOMATIC MOVEMENTS
            
            var obstacleCheck = function(pos, entity, game){
                var size = entity.size,
                    fullMap = game.level.fullMap,
                    xStart = Math.floor(pos.x),
                    xEnd = Math.ceil(pos.x + size.x),
                    yStart = Math.floor(pos.y),
                    yEnd = Math.ceil(pos.y + size.y);

                // Entity is outside map limits
                if (xStart < 0 || xEnd > fullMap.width || yStart < 0 || yEnd > fullMap.height)
                    return true;

                // Check for obstacles
                for (var y = yStart; y < yEnd; y++) {
                    for (var x = xStart; x < xEnd; x++) {
                      var tileId = x + ',' + y,
                          tile = fullMap.tiles[tileId];
                      if(!tile.isEmpty){
                        if(tile.entity.substance === "hard"){
                            return true;
                        }
                      }
                    }
                }
                return false;
            };
            var slide = function(entity, step, game, speed){
                // define inital speed and direction
                var rDir = Math.round(Math.random()) * Math.round(Math.random()) * 2 - 1;
                var rSpeed = Math.random() * 1.5 + 0.5;
                entity.speed = entity.speed || speed || new Vector(1,0).times(rDir).times(rSpeed);

                var tile = game.level.fullMap.tiles[entity.getTile()];
                tile.isEmpty = true;
                tile.entity = null;

                // change position
                var newPos = entity.position.plus(entity.speed.times(step));
                // check if there is an obstacle
                if(obstacleCheck(newPos, entity, game)){
                    // change direction if so
                    entity.speed = entity.speed.times(-1);
                }
                else {
                    entity.position = newPos;
                }

                tile = game.level.fullMap.tiles[entity.getTile()];
                tile.isEmpty = false;
                tile.entity = entity;
            };
            var wobble = function(entity, step, game){

                entity.basePosition = entity.basePosition || entity.position.plus(new Vector(0.2, 0.1));        

                entity.wobble = entity.wobble || Math.random() * Math.PI * 2;

                entity.wobble += step * 8;
                var wobblePos = Math.sin(entity.wobble) * 0.07;

                entity.position = entity.basePosition.plus(new Vector(0, wobblePos));

            };
            
            // CLASSES DEFINITIONS
            
            // Vector object definition
            var Vector = function(x,y){
                this.x = x; this.y = y;
            };
            Vector.prototype.plus = function(other){
                return new Vector(this.x + other.x, this.y + other.y);
            };
            Vector.prototype.minus = function(other){
                return new Vector(this.x - other.x, this.y - other.y);
            };
            Vector.prototype.times = function(factor){
                return new Vector(this.x * factor, this.y * factor);
            };

            // Entity object definition
            var Entity = function(config){
                this.position = new Vector(config.position.x, config.position.y);
                this.size = new Vector(config.size.x, config.size.y);
            };
            Entity.prototype.getTile = function(){
                var centerX = Math.floor(this.position.x + this.size.x/2),
                    centerY = Math.floor(this.position.y + this.size.y/2),
                    tileId = centerX + "," + centerY;

                return tileId;
            };
            Entity.prototype.collisionCheck = function(other){
                // get the vectors to check against
                var vX = (this.position.x + (this.size.x / 2)) - (other.position.x + (other.size.x / 2)),
                    vY = (this.position.y + (this.size.y / 2)) - (other.position.y + (other.size.y / 2)),
                    // add the half widths and half heights of the objects
                    hWidths = (this.size.x / 2) + (other.size.w / 2),
                    hHeights = (this.size.y / 2) + (other.size.h / 2);

                // if the x and y vector are less than the half width or half height, they we must be inside the object, causing a collision
                return Math.abs(vX) < hWidths && Math.abs(vY) < hHeights;
            };
            Entity.prototype.collisionResolve = function(other, resolveFunc){
                // get the vectors to check against
                var vX = (this.position.x + (this.size.x / 2)) - (other.position.x + (other.size.x / 2)),
                    vY = (this.position.y + (this.size.y / 2)) - (other.position.y + (other.size.y / 2)),
                    // add the half widths and half heights of the objects
                    hWidths = (this.size.x / 2) + (other.size.w / 2),
                    hHeights = (this.size.y / 2) + (other.size.h / 2),
                    collision = {
                        other: other,
                        fromTop: false,
                        fromBottom: false,
                        fromRight: false,
                        fromLeft: false
                    };
                // if the x and y vector are less than the half width or half height, they we must be inside the object, causing a collision
                if(Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
                    // figures out on which side we are colliding (top, bottom, left, or right)
                    var oX = hWidths - Math.abs(vX),
                        oY = hHeights - Math.abs(vY);
                    if (oX >= oY) {
                        if (vY > 0) {
                            collision.fromTop = true;
                        } else {
                            collision.fromBottom = true;
                        }
                    } else {
                        if (vX > 0) {
                            collision.fromLeft = true;                    
                        } else {
                            collision.fromRight = true;                    
                        }
                    }
                }

                resolveFunc(collision);

            };

            // Player Object defitiion
            var Player = function(config){
                Player.parent.constructor.apply(this, arguments);
                this.speed = new Vector(0,0);
                this.substance = "hard";
                this.isJumping = false;
                this.isGrounded = false;
                this.motion = new Vector(0,0);
                this.standby = 0;
                this.direction = new Vector(1,1);
                this.colors = ["black", "#022", "#066", "#0AA"];
                this.imgs = config.imgs;
                this.checkpoint = this.position;
            };
            extend(Player, Entity, "player");
            Player.prototype.render = function(context, tileSize, position){
                var pos = this.position.minus(position).times(tileSize);
                var size = this.size.times(tileSize);

                var imgSize = new Vector(64, 128);
                var imgCenter = imgSize.x * 5;

                // Set the picture according to the movement
                //var img = scope.resources.get("/img/walking2.svg");
                var img = new Image();
                img.src = "/img/walking2.png";

                if(this.standby > 480 && this.standby % 48 === 0){
                    this.direction.x = this.direction.x * -1;
                    this.standby = 0;
                }

                var m = imgCenter + (this.direction.x * Math.ceil(this.motion.x/6) * imgSize.x);

                var width = imgSize.x * this.direction.x;

                if(!this.isGrounded){
                    if(this.direction.x >= 0){
                        this.direction.y < 0 ?
                        // going up
                        m = imgSize.x * 8 :
                        // going down
                        m = imgSize.x * 9;
                    }
                    else {
                        this.direction.y < 0 ?
                        // going up
                        m = imgSize.x * 2 :
                        // going down
                        m = imgSize.x * 1
                    }
                }

                context.beginPath();
                context.drawImage(img, m, 0, width, imgSize.y, pos.x, pos.y, size.x, size.y);
                context.closePath();
            };
            Player.prototype.obstacleAt = function(pos, game){
                var size = this.size;
                var fullMap = game.level.fullMap;
                pos = pos.minus(game.position);
                var xStart = Math.floor(pos.x) + game.position.x;
                var xEnd = Math.ceil(pos.x + size.x)  + game.position.x;
                var yStart = Math.floor(pos.y) + game.position.y;
                var yEnd = Math.ceil(pos.y + size.y)  + game.position.y;

                if (xStart < 0 || xEnd > fullMap.width || yStart > fullMap.height)
                    return "edge";        

                if (yStart < 0 || yEnd > fullMap.height)
                    return null;

                for (var y = yStart; y < yEnd; y++) {
                    for (var x = xStart; x < xEnd; x++) {
                      var tileId = x + ',' + y,
                          tile = fullMap.tiles[tileId];
                      if(!tile.isEmpty){
                          var rectA;
                          if(this.direction.x > 0){
                            rectA = {
                              left:   pos.x + game.position.x + 0.18,
                              top:    pos.y + game.position.y,
                              right:  pos.x + size.x + game.position.x - 0.08,
                              bottom: pos.y + game.position.y + size.y
                            };
                          }
                          else{
                              rectA = {
                              left:   pos.x + game.position.x + 0.08,
                              top:    pos.y + game.position.y,
                              right:  pos.x + + game.position.x + size.x - 0.18,
                              bottom: pos.y + + game.position.y + size.y
                            };
                          }
                            var rectB = {
                              left:   tile.entity.position.x,
                              top:    tile.entity.position.y,
                              right:  tile.entity.position.x + tile.entity.size.x,
                              bottom: tile.entity.position.y + tile.entity.size.y
                            };

                          var fineCheck = intersectRect(rectA, rectB);

                          if(fineCheck){
                            if(tile.entity.substance === "hard"){
                                if(tile.entity.constructor.type === "lift"){
                                    if(this.position.y + this.size.y <= tile.entity.position.y){
                                        console.log("I need a lift");
                                    }
                                    else {
                                        return null;
                                    }
                                }
                                return tile.entity;
                            }
                            else {
                                if(tile.entity.constructor.type === "coin" && !tile.entity.isTouched){
                                    this.checkpoint = new Vector(tile.entity.position.x, -this.size.y);
                                }
                                tile.entity.isTouched = true;
                            }
                          }
                      }
                    }
                }
                return null;
            };
            Player.prototype.moveX = function(step,game,keys,move){
                // Simulate player move
                var playerXSpeed = 3.3;
                var initialPos = this.position;
                this.speed.x = 0;
                if(keys.right){ this.speed.x += playerXSpeed; }
                if(keys.left){ this.speed.x -= playerXSpeed; }
                var motion = new Vector(this.speed.x * step, 0);
                var newPosition = this.position.plus(motion);

                // Check if there will be a collision at new position
                var obstacle = this.obstacleAt(newPosition, game);
                if(obstacle){
                    // if the player is outside the margin reset it's position
                    if(obstacle === "edge"){
                        this.position = this.checkpoint;
                        console.log("You lose", this.position);
                    }
                    // if there is an obstacle stop
                    newPosition = initialPos;
                }
                else {
                    if(move.indexOf("x") > -1)
                        this.position = newPosition;            
                }

                // check if the player is moving 
                if(initialPos.x === newPosition.x){
                    // player is not moving
                    this.motion.x = 0;
                    //this.direction = 0;
                }else{
                    // player is moving
                    initialPos.x < newPosition.x ? this.direction.x = 1 : this.direction.x = -1;
                    if(this.motion.x < 24){
                        this.motion.x += 1;
                    }else{
                        this.motion.x = 1;
                    }
                }
                return newPosition.x;
            };
            Player.prototype.moveY = function(step,game,keys,move){
                var gravity = 30;
                var jumpSpeed = 13;
                var initialPos = this.position;

                this.speed.y += step * gravity;
                var motion = new Vector(0, this.speed.y * step);
                var newPosition = this.position.plus(motion);
                var obstacle = this.obstacleAt(newPosition, game);
                // check for collisions
                this.isGrounded = false;
                if(obstacle){
                    // if the player is outside the margin reset it's position
                    if(obstacle === "edge"){
                        this.position = this.checkpoint;
                    }
                    // handle collisions
                        newPosition = initialPos;

                    // make the player jump
                    if(keys.up && this.speed.y > 0){
                        this.isJumping = true;
                        this.isGrounded = false;
                        this.speed.y = -jumpSpeed;
                    }
                    else {
                        this.isJumping = false;
                        this.isGrounded = true;
                        this.speed.y = 0;
                    }
                    if(obstacle.constructor.type ==="lift"){
                        console.log("Lift me up!");
                        this.isGrounded = true;
                        this.isJumping = false;
                        this.speed.y = obstacle.speed.y;
                        newPosition = new Vector(this.position.x, obstacle.position.y - this.size.y);
                    }
                }
                else {
                    if(move.indexOf("y") > -1)
                        this.position = newPosition;
                }

                // check if the player is moving 
                if(initialPos.y === newPosition.y){
                    // player is not moving
                    this.motion.y = 0;
                    //this.direction = 0;
                }else{
                    // player is moving
                    initialPos.y < newPosition.y ? this.direction.y = 1 : this.direction.y = -1;
                    if(this.motion.y < 48){
                        this.motion.y += 1;
                    }else{
                        this.motion.y = 1;
                    }
                }

                return newPosition.y;
            };
            Player.prototype.process = function(step, game, keys, move){
                move = move || "xy"

                var newX = this.moveX(step,game,keys,move);
                var newY = this.moveY(step,game,keys,move);
                if(this.motion.x === 0 && this.motion.y === 0){
                    this.standby += 1;
                }
                else {
                    this.standby = 0;
                }

                return new Vector(newX, newY);
            };

            // Wall Object definition
            var Wall = function(config){
                Wall.parent.constructor.apply(this, arguments);
                this.substance = "hard";
                this.imgs = ["bricks.svg"];
            };
            extend(Wall, Entity, "wall");
            Wall.prototype.render = function(context, tileSize, position){
                var pos = this.position.minus(position).times(tileSize);
                var size = this.size.times(tileSize);

                //var img = scope.resources.get("/img/bricks.svg")
                var img = new Image();
                img.src = "/img/bricks.svg";

                context.beginPath();
                context.fillStyle = "indianred";
                context.fillRect(pos.x, pos.y, size.x, size.y);
                context.drawImage(img, pos.x, pos.y, size.x, size.y);
                context.closePath();
            };
            Wall.prototype.process = function(step, game, keys){
                return;
            };

            // Lift Object definition
            var Lift = function(config){
                Lift.parent.constructor.apply(this, arguments);
                this.speed = new Vector(0,1);
                this.substance = "hard";
                this.imgs = ["/img/bricks.svg"];
            };
            extend(Lift, Wall, "lift");
            Lift.prototype.process = function(step, game, keys){
                slide(this, step, game, this.speed);
            };
            
            // Bird Object definition
            var Bird = function(config){
                var random = Math.round(Math.random()) * 2 - 1;
                Bird.parent.constructor.apply(this, arguments);
                this.size = this.size.times(0.6);
                this.motion = new Vector(0,0);
                this.direction = new Vector(1,1);
                this.substance = "soft";
                this.imgs = ["/img/bird.png"];
            };
            extend(Bird, Entity, "bird");
            Bird.prototype.render = function(context, tileSize, position){
                var pos = this.position.minus(position).times(tileSize);
                var size = this.size.times(tileSize);
                var imgSize = new Vector(150, 150);
                var imgCenter = imgSize.x * 4;
                //var img = scope.resources.get("/img/bird.png");
                var img = new Image();
                img.src = "/img/bird.png";

                var m = imgCenter + (this.direction.x * Math.ceil(this.motion.x/8) * imgSize.x);
                var width = imgSize.x + this.direction.x;
                /*
                context.beginPath();        
                //context.drawImage(img, pos.x, pos.y, size.x, size.y);
                context.fillStyle = "#555";
                context.fillRect(pos.x, pos.y, size.x, size.y);
                context.closePath();
                */

                context.beginPath();
                context.drawImage(img, m, 0, width, imgSize.y, pos.x, pos.y, size.x, size.y);
                context.closePath();
            };
            Bird.prototype.obstacleAt = function(pos, game){
                var size = this.size;
                var fullMap = game.level.fullMap;
                var xStart = Math.floor(pos.x) + game.position.x;
                var xEnd = Math.ceil(pos.x + size.x)  + game.position.x;
                var yStart = Math.floor(pos.y) + game.position.y;
                var yEnd = Math.ceil(pos.y + size.y)  + game.position.y;

                if (xStart < 0 || xEnd > fullMap.width || yStart < 0 || yEnd > fullMap.height)
                    return null;

                for (var y = yStart; y < yEnd; y++) {
                    for (var x = xStart; x < xEnd; x++) {
                      var tileId = x + ',' + y,
                          tile = fullMap.tiles[tileId];
                      if(!tile.isEmpty){
                        if(tile.entity.substance === "hard"){
                            console.log("ouch!");
                            return tile.entity;
                        }
                        else {
                            //tile.entity.isTouched = true;
                        }
                      }
                    }
                }
                return null;
            };
            Bird.prototype.process = function(step, game, keys){
                /*
                var newPos = this.position.plus(this.speed.times(step));

                if(!this.obstacleAt(newPos, game)){
                    var centerX = Math.floor(this.position.x + this.size.x/2);
                    var centerY = Math.floor(this.position.y + this.size.y/2);
                    var tile = game.level.fullMap.tiles[centerX+','+centerY];
                    tile.isEmpty = true;

                    this.position = newPos;

                    centerX = Math.floor(this.position.x + this.size.x/2);
                    centerY = Math.floor(this.position.y + this.size.y/2);
                    tile = game.level.fullMap.tiles[centerX+','+centerY];
                    tile.isEmpty = false;
                    tile.entity = new Bird({
                        position: new Vector(this.position.x, this.position.y),
                        size: new Vector(this.size.x, this.size.y),
                        speed: new Vector(this.speed.x, this.speed.y)
                    });
                }
                else {
                    this.speed = this.speed.times(-1);
                }
                */

                //wobble(this, step, game);
                slide(this, step, game);

                this.speed.x > 0 ? this.direction.x = 1 : this.direction.x = -1;

                if(this.motion.x < 24){
                    this.motion.x += 1;
                }else{
                    this.motion.x = 1;
                }
            };

            // Coin Object definition
            var Coin = function(config){
                Coin.parent.constructor.apply(this, arguments);
                this.basePosition = this.position = this.position.plus(new Vector(0.4, 0.2));
                this.size = this.size.times(0.4);
                this.substance = "soft";
                this.isTouched = false;
                this.imgs = ["/img/coin.svg"];
            };
            extend(Coin, Entity, "coin");
            Coin.prototype.render = function(context, tileSize, position){
                var pos = this.position.minus(position).times(tileSize);
                var size = this.size.times(tileSize);
                var color = "gold";
                if(this.isTouched){
                    color = "#fff";
                }
                //var img = scope.resources.get("/img/coin.svg");
                var img = new Image();
                img.src = "/img/coin.svg";

                context.beginPath();
                if(this.isTouched){
                    //context.fillStyle = color;
                    //context.fillRect(pos.x, pos.y, size.x, size.y);
                }
                else
                {
                context.drawImage(img, pos.x, pos.y, size.x, size.y);
                }
                context.closePath();
            };
            Coin.prototype.process = function(step, game, keys){
                if(!this.isTouched){
                    wobble(this, step, game);
                    //this.wobble += step * 8;
                    //var wobblePos = Math.sin(this.wobble) * 0.07;
                    //this.position = this.basePosition.plus(new Vector(0, wobblePos));
                }
            };

            // Tile Object definition
            var Tile = function(config){
                config.entity = config.entity || null;
                config.id = config.id || config.position.x + ',' + config.position.y;
                Tile.parent.constructor.apply(this, arguments);

                this.id = config.id;

                this.entity = null;
                this.isEmpty = true;

                if(config.entity){
                    this.isEmpty = false;
                    this.entity = new config.entity(config);
                   if(this.entity.imgs){
                       //scope.resources.load(this.entity.imgs);
                       //scope.imageLocations.push(this.entity.img);
                   }
                }
            };
            extend(Tile, Entity, "tile");
            Tile.prototype.render = function(context, tileSize, position){
                position = position || new Vector(0,0);
                if(this.isEmpty){
                    return;
                }
                this.entity.render(context, tileSize, position);
            };
            Tile.prototype.process = function(step, game, keys){
                if(this.isEmpty){
                    return;
                } else {
                    this.entity.process(step, game, keys);
                }
            };

            // Map object definition
            var Map = function(map){
                this.width = map[0].length;
                this.height = map.length;
                this.tiles = {};
                var chars = {                
                        "#": Wall,
                        "*": Coin,
                        "v": Bird,
                        "-": Lift
                    };

                for(var y=0; y < this.height; y++){
                    for(var x=0; x < this.width; x++){
                        var char = map[y][x],
                            entity = chars[char],
                            index = x + "," + y,
                            config = {
                                position: new Vector(x,y),
                                size: new Vector(1,1)                        
                            };
                        if(entity){
                            config.entity = entity;
                        }
                        this.tiles[index] = new Tile(config);
                    }
                }
            };
            Map.prototype.visibleTiles = function(startX, startY, width, height){
                var visibleTiles = {};
                var endX = startX + width;
                var endY = startY + height;

                for(y=startY; y < endY; y++){
                    for(x=startX; x < endX; x++){
                        var tileId = x + ',' + y,
                            tile = this.tiles[tileId],
                            newX = (x - startX),
                            newY = (y - startY),
                            newId = newX + ',' + newY,
                            config = {
                                position: new Vector(newX,newY),
                                size: tile.size,
                                id: x+','+y
                            };
                        if(tile.entity){
                            config.entity = tile.entity.constructor;
                        }

                        visibleTiles[newId] = new Tile(config);
                    }
                }
                return visibleTiles;
            };
            
            // Level Object definition
            var Level = function(level){
                this.size = new Vector(level.map[0].length, level.map.length);
                this.player = new Player(level.player);
                this.fullMap = new Map(level.map);
                this.status = this.finishDelay = null;
                this.background = level.background;
            };    
            Level.prototype.process = function(step, keys){
                if(this.status != null){
                    this.finishDelay -= step;
                }
                while (step > 0){
                    var thisStep = Math.min(step, maxStep)            
                    this.tiles.forEach(function(factor){
                        actor.act(thisStep, this, keys);
                    }, this);
                    step -= thisStep;
                }
            };
            
            // PUBLIC INTERFACE
            
            return {
                
                // Properties
                
                tileSize: tileSize,
                width: gameWidth,
                height: gameHeight,
                context: context,
                position: new Vector(0,0),
                inputs: {
                    left: false,
                    right: false,
                    up: false,
                    down: false
                },
                
                // Methods
                
                init: function(level){
                    var self = this;

                    // Set config for the level
                    this.level = new Level(level);

                    /*
                    scope.resources.load(this.level.background);
                    scope.resources.load(this.level.player.imgs);
                    */

                    // Find canvas width
                    this.height = gameHeight;
                    canvas.height = gameHeight * tileSize;
                    this.width = Math.ceil(canvas.parentElement.clientWidth / tileSize);
                    canvas.width = gameWidth * tileSize;

                    console.log(Math.ceil(canvas.parentElement.clientWidth / tileSize));
                    // add event listeners
                    document.body.addEventListener("keydown", function (e) {
                        self.readInput(e, true);
                    });

                    document.body.addEventListener("keyup", function (e) {
                        self.readInput(e, false);
                    });

                    window.onresize = function(){
                        self.status = "resizing";
                        // adjust visible width
                        self.height = gameHeight;
                        canvas.height = gameHeight * tileSize;
                        self.width = Math.ceil(canvas.parentElement.clientWidth / tileSize);
                        canvas.width = self.width * tileSize;
                        self.status = null;
                    };
                    
                    self.process();


                    /*
                    scope.resources.onReady(function(){
                        self.process();
                    });            
                    */
                    //window.addEventListener("load", function () {});        

                },

                readInput: function(e, bool){
                    switch(e.which) {
                        case 37: // left
                            this.inputs.left = bool;
                            break;

                        case 38: // up
                            this.inputs.up = bool;
                            break;

                        case 39: // right
                            this.inputs.right = bool;
                            break;

                        case 40: // down
                            this.inputs.down = bool;
                            break;

                        default: return; // exit this handler for other keys
                    }

                    e.preventDefault();
                },

                process: function(){
                    var self = this;
                    runAnimation(function(step){

                        if(self.status != null){
                            self.finishDelay -= step;
                        }                 

                        while (step > 0 && !self.isScrolling) {
                            var maxStep = 0.5,
                                thisStep = Math.min(step, maxStep);

                            // animate the player
                            self.level.player.process(thisStep, self, self.inputs);

                            // animate the background
                            /*
                            for(var y = self.position.y; y < self.position.y + self.height; y++){
                                for(var x = self.position.x; x < self.position.x + self.width; x++){
                                    var tileId = x + ',' + y;
                                    var tile = self.level.fullMap.tiles[tileId];
                                    tile.process(thisStep, self, self.inputs);
                                }
                            }
                            */

                            for(var y = 0; y < self.level.fullMap.height; y++){
                                for(var x = 0; x < self.level.fullMap.width; x++){
                                    var tileId = x + ',' + y;
                                    var tile = self.level.fullMap.tiles[tileId];
                                    tile.process(thisStep, self, self.inputs);
                                }
                            }

                            step -= thisStep;
                            //var tracker = document.getElementById("tracker").getElementsByTagName("p")[0];
                            var tracker = $("#tracker p");
                            tracker.innerHTML = Math.floor(self.level.player.position.x);
                        }

                        self.render();
                    });

                },

                scrollCheck : function(){

                    var margin = 3;
                    var player = this.level.player;
                    var playerAX = Math.floor(player.position.x - this.position.x);
                    var playerBX = Math.ceil(player.position.x - this.position.x + player.size.x);            

                    var scrollLeftNeeded = playerAX > 0 && playerAX < margin;
                    var scrollRightNeeded = playerBX > this.width - margin && playerBX < this.width;
                    var result = false;

                    if(scrollLeftNeeded && this.position.x > 0){
                        this.position.x -= 1;
                        //player.position.x += 1;
                        result = true;
                    }

                    if(scrollRightNeeded && this.position.x + this.width < this.level.fullMap.width){
                        this.position.x += 1;
                        //player.position.x -= 1;
                        result = true;
                    }

                    if(playerAX < 0 && this.position.x > 0){
                        while(Math.floor(player.position.x - this.position.x) < 0 && this.position.x > 0){
                          this.position.x--; 
                        }
                        result = true;
                    }
                    else if(playerBX > this.width && this.position.x + this.width < this.level.fullMap.width)
                    {
                        while(Math.ceil(player.position.x - this.position.x + player.size.x) > this.width && this.position.x + this.width < this.level.fullMap.width){
                          this.position.x++;
                        }
                        result = true;
                    }

                    if(this.position.x < 0){
                        this.position.x = 0;
                    }
                    else if(this.position.x + this.width > this.level.fullMap.width){
                        this.position.x = this.level.fullMap.width - this.width;
                    }

                    return result;

                },

                render: function(){
                    var self = this;
                    // clear the canvas
                    this.context.clearRect(0,0,this.width * this.tileSize, this.height * this.tileSize);

                    // scroll check
                    this.scrollCheck();

                    // draw the background
                    //var bg = scope.resources.get("/img/living.png");
                    var bg = new Image();
                    bg.src = "/img/living.png";

                    var bgSpeed = 1;
                    this.context.beginPath();
                    this.context.drawImage(bg,
                                           // Portion of the image
                                           this.position.x * tileSize * bgSpeed,
                                           this.position.y * tileSize * bgSpeed,
                                           this.width * tileSize,
                                           this.height * tileSize,
                                           // Canvas size
                                           0,
                                           0,
                                           this.width * tileSize,
                                           this.height * tileSize);
                    this.context.closePath();

                    // draw the player
                    this.level.player.render(this.context, this.tileSize, this.position);

                    // draw the level entities
                    for(var y=this.position.y; y<this.position.y + this.height; y++){
                        for(var x=this.position.x; x<this.position.x + this.width; x++){
                            tile = self.level.fullMap.tiles[x+','+y];
                            tile.render(this.context, this.tileSize, this.position);
                        }
                    }


                    // draw the foreground

                    // var bg = scope.resources.get("/img/living-front.png");
                    var fg = new Image();
                    fg.src = "/img/living-front.png";

                    var bgSpeed = 1;
                    this.context.beginPath();
                    this.context.drawImage(fg,
                                           // Portion of the image
                                           this.position.x * tileSize * bgSpeed,
                                           this.position.y * tileSize * bgSpeed,
                                           this.width * tileSize,
                                           this.height * tileSize,
                                           // Canvas size
                                           0,
                                           0,
                                           this.width * tileSize,
                                           this.height * tileSize
                                          );
                    this.context.closePath();



                }
                
            };
            
        })();
    
        // initialize canvas
        var canvas = elem.find('canvas')[0];
        var context = canvas.getContext('2d');
        var tileSize = 64;
        var gameWidth = 32;
        var gameHeight = 8;
        canvas.width = tileSize * gameWidth;
        canvas.height = tileSize * gameHeight;
        
        // define the level config  
        var level = {
            map: [
                "#       #                                      #",
                "#       #           v                          #",
                "#       # v                                    #",
                "#       #v                                     #",
                "#       #   v                         ##   ##  #",
                "#                                    -         #",
                "#     -       *                           *    #",
                "###########-#########################         ##"
            ],
            background: [
                "/img/living.png",
                "/img/living-front.png"
            ],
            player: {
                position: {
                    x: 1,
                    y: 3
                },
                size: {
                    x: 0.8,
                    y: 1.6
                },
                imgs: [
                    "/img/walking2.png"
                ]
            },
            imgs: [
                "/img/walking2.png",
                "/img/living.png",
                "/img/living-front.png",
                "/img/bird.png
            ]
        };
        
        // load images
        scope.isLoading = true;
        scope.isSuccessful = false;
        scope.percentLoaded = 0;
        scope.imageLocations = level.imgs;

        preloader.preloadImages(scope.imageLocations).then(
            function handleResolve(imageLocations){
                scope.isLoading = false;
                scope.isSuccessful = true;
                console.info("Preload successful");
                // initialize platformer
                Platformer.init(level);
            },
            function handleReject(imageLocation){
                scope.isLoading = false;
                scope.isSuccessful = false;
                console.error("Image Failed", imageLocation);
                console.info("Preload failure");
            },
            function handleNotify(event){
                scope.percentLoaded = event.percent;
                console.info("Percent loaded:", event.percent);
            }
        );
        
    }
    
    return {
        restrict: 'AE',
        template: '<canvas id="resume" style="border: 1px solid black;"></canvas>',
        link: link
    };
}