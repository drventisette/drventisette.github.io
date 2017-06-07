---
title: main.js
---
// Helper functions
var Dr27 = Dr27 || {};

Dr27.helpers = {
  DecodeHtml: function(str) {
    return $('<div/>').html(str).text();
  },
  get: function(what, where, proof){
    var result = undefined,
        i=0;
    for(var i; i < where.length; i++){
      var test = where[i];      
      if(test[proof] === what){
        result = test;
      }
    }
    return result;
  }
};

// Controllers
function MtcCtrl($scope){
  ctrl = this;
  $scope.$watchCollection('mtc.page', function(oldV, newV){
    this.page = newV;
  });
}

function SandwichCtrl(SiteService, $location){
  this.pages = SiteService.pages;
  this.isActive = function(p){
    var activeClass = '',
        url = $location.url();
    if(url === p.url ){
      activeClass = 'active';
      
    }
    else if(p.url !== '/'){
      url.indexOf(p.url) !== -1 ? activeClass = 'active' : activeClass = '';
    }
    return activeClass;
  }
}

function PostsCtrl($scope, getPosts, $timeout){
  var ctrl = this,
      mtc = $scope.mtc,
      li;
  
  // Define posts array
  ctrl.posts = getPosts;
  
  // Default all posts to inactive on first load
  ctrl.activePost = undefined;
  
  // $Watch posts array to apply changes once a post is activated
  $scope.$watch(
    function(scope){
      return(ctrl.activePost);
    },
    function(newVal, oldVal){
      angular.forEach(ctrl.posts, function(post){
        post === newVal ? post.isActive = true : post.isActive = false;
      });
    }, true);
  
  // Helper method to scroll the container
  ctrl.scrollTo = function(target){
    var container = $('.text-content');
    if(target === 'top'){
      container.animate({
        scrollTop: 0
      }, 500);
    }
    else
    {
      var li = $('#'+target),
          a = $('#'+target+' a'),
          parent = $('.accordion'),
          position = li.prevAll('.accordion-navigation').length,
          offsetTop = Math.round(parent.position().top + (a.innerHeight() * position));
      container.animate({
        scrollTop: offsetTop
      }, "slow");
    }
  };
}

function PostIndexCtrl($scope, getPage, $timeout){
  var ctrl = this;
  
  ctrl.page = getPage;
  $scope.mtc.page = ctrl.page;
  $scope.mtc.post = false;
  $scope.p.activePost = undefined;
  $scope.p.scrollTo('top');
  
  // Helper method to collapse/uncollapse accordion sections
  ctrl.toggleAccordion = function(post, e){
    if(e.target.className.indexOf('label') === -1){
      if(post.isActive){
        $scope.p.activePost = undefined;
      }
      else
      {
        $scope.p.activePost = post;
        $scope.p.scrollTo(post.id);
      }
    }
  };
  
  // Helper method to filter the posts array
  ctrl.toggleFilter = function(tag, e){
    $scope.p.activePost = '';
    $scope.p.scrollTo('top');
    ctrl.filter === tag ? ctrl.filter = '' : ctrl.filter = tag;
  };
}

function PostCtrl(getPost, $scope){
  
  var ctrl = this,
      mtc = $scope.mtc;
  
  ctrl.post = getPost;
  
  $scope.p.scrollTo('top');
  
  if($scope.p.activePost !== ctrl.post){
    $scope.p.activePost = ctrl.post;
  }
  
  ctrl.post.isFirst = ctrl.post.previous === '';
  ctrl.post.isLast = ctrl.post.next === '';
  
  mtc.page = ctrl.post
  mtc.post = true;
}

function PageCtrl(getPage, $scope, $location){
  var ctrl = this,
      mtc = $scope.mtc;
  
  ctrl.page = getPage;
  mtc.page = ctrl.page;
  mtc.post = false;
  
  if(ctrl.page.id === "resume"){
    // refresh the page
    $location.path('/resume/');
  }
}

// Services
function SiteService($q){
  
  var helpers = Dr27.helpers;
  
  this.time = '{{ site.time }}';
  
  // Site's pages
  
  {% capture pages %}
  {% assign site-pages = (site.pages | where: "layout", "mtc") | sort: 'index'%}
  [
    {% for page in site-pages %}
    {
      "index": {{ page.index }},
      "url": '{{ site.baseurl }}{{ page.url }}',
      "id": ('{{ page.path }}').substr(0, ('{{page.path}}').lastIndexOf('.')),
      "title": '{{ page.title }}',
      "media": '{{ page.media }}',
      "content": helpers.DecodeHtml('{{ page.content | escape }}'),
      "cover": '{{ page.cover }}',
      "icon": '{{ page.icon }}'
    },
    {% endfor %}
    {
      "index": 2,
      "url": '{{ site.baseurl }}/posts/',
      "id": 'posts.index',
      "title": 'Posts',      
      "media": '/img/building.jpg',
      "content": '',
      "cover": '/img/building.jpg',
      "icon": 'fa fa-file'
    }
  ];
  {% endcapture %}
  
  this.pages = {{ pages | strip_newlines }};
   
  // Site's posts
  {% capture posts %}
  [
    {% for post in site.categories.posts %}
    {
      "id": ('{{ post.path }}').slice(7,('{{ post.path }}').lastIndexOf('.')),
      "title": '{{ post.title }}',
      "date": '{{ post.date | date: "%d %B %Y" }}',
      "excerpt": helpers.DecodeHtml('{{ post.excerpt | remove: "<p>" | remove : "</p>" | escape }}'),
      "tags": ('{{post.tags}}').split(','),
      "media": '{{ post.media }}',
      "content": helpers.DecodeHtml('{{ post.content | escape }}'),
      "cover": '{{ post.cover }}',
      "previous": ('{{ post.previous.path }}').slice(7, ('{{ post.previous.path }}').lastIndexOf('.')),
      "next": ('{{ post.next.path }}').slice(7,('{{ post.next.path }}').lastIndexOf('.'))
    }
    {% if forloop.last %}{% else %},{% endif %}
    {% endfor %}
  ];
  {% endcapture %}
  
  this.posts = {{ posts | strip_newlines }};
  
  this.getPost = function(id){
    var deferred = $q.defer(),
        result,
        error;
    deferred.notify('Looking for ' + id + '...');
    if(result = helpers.get(id, this.posts, 'id'))
    {
      deferred.resolve(result);
    }
    else
    {
      error = 'Unable to find ' + id + '.';
      deferred.reject(error);
    }
    return deferred.promise;
  };
  
  this.getPage = function(url){
    var deferred = $q.defer(),
        result,
        error;
    
    deferred.notify('Looking for ' + url + '...');
    
    if(result = helpers.get(url, this.pages, 'url'))
    {
      deferred.resolve(result);
    }
    else
    {
      error = 'Unable to find ' + url + '.';
      deferred.reject(error);
    }
    return deferred.promise;
    
    // return helpers.get(url, this.pages, 'url');
  };
   
}

// Directives

function compile($compile, $sce){
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var ensureCompileRunsOnce = scope.$watch(function(scope) {
        return $sce.parseAsHtml(attrs.compile)(scope);
      }, function(value) {
            element.html(value);
            $compile(element.contents())(scope);
            ensureCompileRunsOnce();
        });
    }
  };
}
   
function resumeDirective($sce, $compile, preloader, resumeContent, $window){
    
    function link(scope, elem, attrs){        
        
        // request frame animation
        (function () {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

        // define platformer
        var Platformer = (function(canvas){
            
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
                var img = scope.getImg("/img/walking2.svg");

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
                if(img){
                    context.drawImage(img, m, 0, width, imgSize.y, pos.x, pos.y, size.x, size.y);
                }
                else
                {
                    context.fillRect(pos.x,pos.y,sie.x,size.y);
                }
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

                if(xStart < 0 || xEnd > fullMap.width || yStart > fullMap.height){
                    return "edge";
                }

                if(yStart < 0 || yEnd > fullMap.height){
                    return null;
                }

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
                              right:  pos.x + game.position.x + size.x - 0.18,
                              bottom: pos.y + game.position.y + size.y
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
                        console.log("You lose");
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
                        console.log("You lose");
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
                /*
                var pos = this.position.minus(position).times(tileSize);
                var size = this.size.times(tileSize);

                //var img = scope.resources.get("/img/bricks.svg")
                var img = scope.getImg("/img/bricks.svg");

                context.beginPath();
                context.fillStyle = "indianred";
                context.fillRect(pos.x, pos.y, size.x, size.y);
                if(img){
                    context.drawImage(img, pos.x, pos.y, size.x, size.y);
                }
                context.closePath();
                */
            };
            Wall.prototype.process = function(step, game, keys){
                return;
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
                var img = scope.getImg("/img/bird.png");
                
                if(img){
                    var m = imgCenter + (this.direction.x * Math.ceil(this.motion.x/8) * imgSize.x);
                    var width = imgSize.x + this.direction.x;
                    context.beginPath();
                    context.drawImage(img, m, 0, width, imgSize.y, pos.x, pos.y, size.x, size.y);
                    context.closePath();
                }
                else {
                    context.beginPath();        
                    //context.drawImage(img, pos.x, pos.y, size.x, size.y);
                    context.fillStyle = "#555";
                    context.fillRect(pos.x, pos.y, size.x, size.y);
                    context.closePath();
                }

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
                var img = scope.getImg("/img/coin.svg");

                context.beginPath();
                if(this.isTouched || img === null){
                    context.fillStyle = color;
                    context.fillRect(pos.x, pos.y, size.x, size.y);
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
                        "v": Bird
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
                this.chapters = level.chapters;
                this.chapter = 0;
            };    
            Level.prototype.process = function(position){
                /*
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
                */
                // Update current chapter
                var currentChapter = this.getChapter(position);
                if(currentChapter && currentChapter !== this.chapter){
                    this.chapter = currentChapter;
                    var c = this.chapters[currentChapter];
                    var ch = resumeContent.getChapter(c.name);
                    console.log(ch);
                    scope.$apply(function(){
                        scope.page.page.ch = ch;
                        scope.page.page.mediaText = ch.title;
                        scope.page.page.coverText = ch.subtitle;
                    });
                    console.log(scope);
                }
                else if(currentChapter === undefined)
                {
                    this.chapter = undefined;
                    scope.$apply(function(){
                        scope.page.page.date = "";
                        scope.page.page.mediaText = undefined;
                        scope.page.page.coverText = undefined;
                    });
                }                
            };
            Level.prototype.getChapter = function(position){
                var chap = undefined;
                for(var i=0; i<this.chapters.length; i++){
                    var test = this.chapters[i];
                    if(position.x > test.aX &&
                       position.x < test.bX &&
                       position.y > test.aY &&
                       position.y < test.bY)
                    {
                        chap = i;
                    }
                }
                return chap;
            };
            
            // PUBLIC INTERFACE
            return {
                
                // Properties
                tileSize: 32,
                width: 110,
                height: 14,
                context: canvas.getContext('2d'),
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
                    this.tileSize = level.tileSize;
                    this.height = level.gameHeight;
                    canvas.height = this.height * this.tileSize;
                    this.width = Math.ceil(canvas.parentElement.parentElement.parentElement.parentElement.clientWidth / this.tileSize);
                    //this.width = level.gameWidth;
                    canvas.width = this.width * this.tileSize;

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
                        self.width = Math.ceil(canvas.parentElement.parentElement.clientWidth / self.tileSize);
                        canvas.width = self.width * self.tileSize;
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

                            for(var y = 0; y < self.level.fullMap.height; y++){
                                for(var x = 0; x < self.level.fullMap.width; x++){
                                    var tileId = x + ',' + y;
                                    var tile = self.level.fullMap.tiles[tileId];
                                    tile.process(thisStep, self, self.inputs);
                                }
                            }

                            step -= thisStep;
                            self.level.process(self.level.player.position)
                            //var tracker = document.getElementById("tracker").getElementsByTagName("p")[0];
                            //var tracker = $("#tracker p");
                            //tracker.innerHTML = Math.floor(self.level.player.position.x);
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
                    var tileSize = this.tileSize;
                    // clear the canvas
                    this.context.clearRect(0,0,this.width * this.tileSize, this.height * this.tileSize);

                    // scroll check
                    this.scrollCheck();

                    // draw the background
                    
                    //var bg = scope.resources.get("/img/platformerBG.png");
                    var bg = scope.getImg("/img/platformerBG.png");

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
                                           2 * tileSize,
                                           this.width * tileSize,
                                           this.height * tileSize);
                    this.context.closePath();
                    
                    var noise = scope.getImg("/img/noise.png");

                    var bgSpeed = 1;
                    this.motion = this.motion || 0;
                    var frame = Math.round(this.motion / 4) * 384;
                    /*
                    if(this.motion % 4 === 0){
                        var random = Math.round(Math.random() * 6);
                        frame = this.motion / 4 * 384;
                    }
                    else{
                        frame = 0;
                    }
                    */
                    if(this.motion <= 24){
                        this.motion ++
                    }
                    else
                    {
                        this.motion = 0;
                    }
                    
                    this.context.beginPath();
                    
                    this.context.drawImage(noise,
                                           // Portion of the image
                                           this.position.x * tileSize * bgSpeed,
                                           frame,
                                           this.width * tileSize,
                                           this.height * tileSize,
                                           // Canvas size
                                           0,
                                           2 * tileSize,
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
                    var fg = scope.getImg("/img/platformerFG.png");

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
                                           2 * tileSize,
                                           this.width * tileSize,
                                           this.height * tileSize
                                          );
                    this.context.closePath();
                    
                    
                    $(bg).load(function(){
                        if(!scope.initialized){
                            scope.$apply(function(){
                                scope.initialized = true;
                                console.log('initialized : ', scope.initialized);
                            });
                        }
                    });
                }
                
            };
            
        })(elem.find('canvas')[0]);
    
        // initialize canvas
        var canvas = elem.find('canvas')[0];
        
        // define the level config  
        var level = {
            tileSize: 32,
            gameWidth: 110,
            gameHeight: 14,
            map: [
                "#                                                                                                            #",
                "#                                                                                                            #",
                "##########                                                                                                   #",
                "##########                                                                              ################   ###",
                "##########                                          #                                   #              #     #",
                "#        #         ####                     v       #                #                  #              ##    #",
                "#        #        #####  v                          #                #                  #              #     #",
                "#        #       ######                v            #                #                  #              #   ###",
                "#               #######                                              #                  #              #     #",
                "#              ########                                              #                  #              ##    #",
                "#             #########                                              #####################            ##     #",
                "#            ##########                         -                                                          ###",
                "#           ###########                               ###                                                    #",
                "##############################################################################################################"
            //  |01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789|
            //  |0        10        20        30        40        50        60        70        80        90       100         |
            //  |--------INTRO---------||------------EDU--------------||------WORK----||------OTHER-----||------DEV-----|
            //  |--------1/22----------||------------22/53------------||------53/70---||------70/88-----||----88/103----|
            ],
            background: [
                "/img/platformerBG.png",
                "/img/platformerFG.png",
                "/img/noise.png"
            ],
            player: {
                position: {
                    x: 2,
                    y: 7
                },
                size: {
                    x: 0.8,
                    y: 1.6
                },
                imgs: [
                    "/img/walking2.svg"
                ]
            },
            imgs: [
                "/img/walking2.svg",
                "/img/platformerBG.png",
                "/img/platformerFG.png",
                "/img/bird.png",
                "/img/noise.png"
            ],
            chapters: [
                {
                    name: "intro",
                    aX: 0,
                    aY: 0,
                    bX: 23,
                    bY: 14
                },{
                    name: "education",
                    aX: 23,
                    aY: 0,
                    bX: 53,
                    bY: 14
                },{
                    name: "work",
                    aX: 54,
                    aY: 0,
                    bX: 69,
                    bY: 14
                },{
                    name: "webSkills",
                    aX: 88,
                    aY: 3,
                    bX: 102,
                    bY: 14
                },{
                    name: "otherSkills",
                    aX: 70,
                    aY: 0,
                    bX: 88,
                    bY: 10
                }
            ]
        };
        
        // load images
        scope.isLoading = true;
        scope.isSuccessful = false;
        scope.initialized = false;
        scope.percentLoaded = 0;
        scope.imageLocations = level.imgs;
        scope.imgCache = [];
        scope.getImg = function(path){
            var result;
            for(var i=0; i<scope.imgCache.length; i++){
                if(scope.imgCache[i].src.indexOf(path) != -1){
                    return scope.imgCache[i];
                }
            }
            return null;
        };

        preloader.preloadImages(scope.imageLocations).then(
            function handleResolve(imageLocations){
                scope.isLoading = false;
                scope.isSuccessful = true;
                for(var i=0; i < imageLocations.length; i++){
                    var img = new Image();
                    img.src = imageLocations[i];
                    scope.imgCache.push(img);
                }
                
                // initialize platformer
                //Platformer.init(level);
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
        ).then(function(){
            console.info("Preload successful");
            Platformer.init(level);
        });
        
    }
    
    return {
        restrict: 'AE',
        /* template: '<canvas id="resume" class="hide-for-small-only"  style="position:absolute;bottom:0;left:0;" ng-show="initialized"></canvas>', */
        template: '<canvas id="resume" class="hide-for-small-only"  style="position:absolute;bottom:0;left:0;"></canvas>',
        link: link
    };
}
   
function resumeContent(){
    return {
        "timestamp": "2016-08-30",
        "chapters": [
            {
                "name": "education",
                "type": "timeline",
                "title": "mon parcours de formation",
                "subtitle": "autres formations",
                "list": [
                    
                    {
                        "date": "2008",
                        "place": "Université de Udine",
                        "description": "master en écritures pour le cinéma | scénario & critique",
                        "longdescription": ""
                    },
                    {
                        "date": "2007",
                        "place": "Université de Turin",
                        "description": "licence en Disciplines de l'Art, de la Musique et du Spectacle | option cinéma",
                        "longdescription": ""
                    },
                    {
                        "date": "2003",
                        "place": "Lycée Galileo Galilei de Cirié, Turin",
                        "description": "baccalauréat scientifique",
                        "longdescription": ""
                    }
                ],
                "etc": [
                    "Langua Française écrite - Aleph écriture - Paris",
                    "diplôme SST - Sauveteur Sécouriste du Travail",
                    "Permis de conduire de catégorie B"
                ]
            },
            {
                "name": "work",
                "type": "timeline",
                "title": "mes expériences professionnelles",
                "subtitle": "autres expériences",
                "list": [
                    {
                        "date": "2010 - aujourd'hui",
                        "place": "Le Géant des Beaux-Arts, Paris",
                        "description": "conseiller de vente",
                        "longdescription": ""
                    },
                    {
                        "date": "2008-2010",
                        "place": "Affabula Readings, Turin",
                        "description": "story editor",
                        "longdescription": ""
                    },
                    {
                        "date": "2006",
                        "place": "Laboratorio permanente di ricerca sull'arte dell'attore, Turin",
                        "description": "assistant à la production théâtrale",
                        "longdescription": ""
                    },
                    {
                        "date": "2005",
                        "place": "Piemonte Groove/Festival Club2Club, Turin",
                        "description": "réalisateur/monteur vidéo",
                        "longdescription": ""
                    }
                ],
                "etc": [
                    "Webmaster / assistant technique de l'association Nicarali"
                ]
            },
            {
                "name": "webSkills",
                "type": "skills",
                "title": "dévelopment web",
                "subtitle": "compétences informatiques",
                "list": [
                    {
                        "skill": "html",
                        "level": 9
                    },
                    {
                        "skill": "css",
                        "level": 9
                    },
                    {
                        "skill": "javascript",
                        "level": 8
                    },
                    {
                        "skill": "angularJs",
                        "level": 6
                    },
                    {
                        "skill": "php/Symfony",
                        "level": 4
                    },
                    {
                        "skill": "ruby/Ruby on Rails",
                        "level": 5
                    },
                    {
                        "skill": "apache Cordova/Ionic",
                        "level": 6
                    },
                    {
                        "skill": "java",
                        "level": 2
                    }
                ],
                "etc": [
                    "gestion de version (Git)",
                    "montage vidéo (Adobe Premiere)",
                    "traitement d'images (Gimp, Inkscape, Photoshop)",
                    "bureautique (MS Office, Open Office)"
                ]
            },
            {
                "name": "otherSkills",
                "type": "skills",
                "title": "compétences linguistiques",
                "subtitle": "intérêts personnels",
                "list": [
                    {
                        "skill": "italien",
                        "level": 10
                    },
                    {
                        "skill": "français",
                        "level": 9
                    },
                    {
                        "skill": "anglais",
                        "level": 9
                    },
                    {
                        "skill": "espagnol",
                        "level": 4
                    }
                ],
                "etc": [
                    "écriture littéraire et cinématographique",
                    "dessin",
                    "graphisme print & web",
                    "photographie argéntique",
                    "musique"
                ]
            },
        ],
        "getChapter" : function(chapterName){
            var test;
            for(var i=0; i < this.chapters.length; i++){
                test = this.chapters[i];
                if(test.name === chapterName){
                    return test;
                }
            }
            return false;
        }
    }
};  
   
// Configuration

function stateRouter($stateProvider, $urlRouterProvider) {
  
  $urlRouterProvider.otherwise('/404/');
  
  $stateProvider
    .state('posts', {
      url: '/posts',
      abstract: true,
      template: '<div ui-view class="post-view"></div>',
      resolve: {
        getPosts: function(SiteService){
          return SiteService.posts;
        }
      },
      controller: 'PostsCtrl',
      controllerAs: 'p'
    })
    
    .state('posts.index', {
      url: '/',
      templateUrl: 'views/posts.html',
      controller: 'PostIndexCtrl',
      resolve: {
        getPage: function($state, SiteService){
          var url = '/posts/',
              promise = SiteService.getPage(url);
          return promise;
        }
      },
      controllerAs: 'posts',
      parent: 'posts'
    })
     
    .state('posts.post', {
      url: '/:id',
      templateUrl: 'views/post.html',
      controller: 'PostCtrl',
      resolve: {
        getPost: function(SiteService, $state, $stateParams){
          var id = $stateParams.id,
              promise = SiteService.getPost(id);
          return promise;
      }
    },
      controllerAs: 'post',
      parent: 'posts'
  })
  
    {% for page in site.pages %}
    .state(('{{ page.path }}').slice(0,('{{ page.path }}').lastIndexOf('.')) , {
      url: '{{ page.url }}',
      templateUrl: 'views/page.html',
      resolve: {
        getPage: function($state, SiteService){
          var url = '{{ page.url }}',
              promise = SiteService.getPage(url);
          return promise;
        }
      },
      controller: 'PageCtrl',
      controllerAs: 'page'
    })
    {% endfor %}
}

// App definition

var app = angular

.module('myApp', ['ui.router', 'ngResource', 'ngAnimate'], function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
})
.config(['$stateProvider', '$urlRouterProvider', stateRouter])
.run(function($rootScope, $state){
    /*  
    $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams){
      if(toState.name === "resume" && fromState.name !== "resume"){          
          location.reload();
      }
    });
    */
  $rootScope.$on('$viewContentLoaded', function () {
    $(document).foundation({
      offcanvas : {
        close_on_click: true,
        open_method: 'overlap'
      }
    });
  });
})
.filter("sanitize", ['$sce', function($sce) {
  return function(htmlCode) {
    return $sce.trustAsHtml(htmlCode);
  };
}])
.filter("tagFilter", [function(){
  return function(posts, filter){
    filter = filter || '';
    var output = [];
    angular.forEach(posts, function(post){
      if(post.tags.indexOf(filter) !== -1 ){
        output.push(post);
      }
    });
    if(output.length > 0){
      return output;
    }
    else {
      return posts;
    }
  };
}])
.factory("preloader", function($q, $rootScope){
    function Preloader(imageLocations){
        this.imageLocations = imageLocations;
        
        this.imageCount = this.imageLocations.length;
        this.loadCount = 0;
        this.errorCount = 0;
        
        this.states = {
            PENDING: 1,
            LOADING: 2,
            RESOLVED: 3,
            REJECTED: 4
        };
        
        this.state = this.states.PENDING;
        
        this.deferred = $q.defer();
        this.promise = this.deferred.promise;   
    }
    
    Preloader.preloadImages = function(imageLocations){
        var preloader = new Preloader(imageLocations);
        return (preloader.load());  
    };
    
    Preloader.prototype = {
        
        constructor: Preloader,
        
        isInitiated: function isInitiated(){
            return (this.state !== this.states.PENDING);
        },
        isRejected: function isRejected(){
            return (this.state === this.states.REJECTED);
        },
        isResolved: function isResolved(){
            return (this.state === this.states.RESOLVED);
        },
        load: function load(){
            if(this.isInitiated()){
                return (this.promise);
            }
            
            this.state = this.states.LOADING;
            
            for(var i=0; i<this.imageCount; i++){
                this.loadImageLocation(this.imageLocations[i]);
            }
            
            return(this.promise);
        },
        
        handleImageError: function handleImageError(imageLocation){
            this.errorCount++;
            if(this.isRejected()){
                return;
            }
            this.state = this.states.REJECTED;
            this.deferred.reject(imageLocation);
        },
        
        handleImageLoad: function handleImageLoad(imageLocation){
            this.loadCount++;
            if(this.isRejected()){
                return;
            }
            this.deferred.notify({
                percent: Math.ceil(this.loadCount / this.imageCount * 100),
                imageLocation: imageLocation
            });
            
            if(this.loadCount === this.imageCount){
                this.state = this.states.RESOLVED;
                this.deferred.resolve(this.imageLocations);
            }
        },
        loadImageLocation: function loadImageLocation(imageLocation){
            var preloader = this;
            
            var image = $(new Image())
            .load(
                function(event){
                    $rootScope.$apply(
                        function(){
                            preloader.handleImageLoad(event.target.src);
                            preloader = image = event = null;
                        }
                    );
                }
            )
            .error(
                function(event){
                    $rootScope.$apply(
                        function(){
                            preloader.handleImageError(event.target.src);
                            preloader = image = event = null;
                        }
                    );
                }
            )
            .prop("src", imageLocation);
            
        }
    };
    return(Preloader);
})

.controller('PostsCtrl', PostsCtrl)
.controller('PostIndexCtrl', PostIndexCtrl)
.controller('PostCtrl', PostCtrl)
.controller('PageCtrl', PageCtrl)
.controller('MtcCtrl', MtcCtrl)
.controller('SandwichCtrl', SandwichCtrl)

.service('SiteService', SiteService)

.factory('resumeContent', resumeContent)

.directive('resume', resumeDirective)
.directive('compile', compile)
;
