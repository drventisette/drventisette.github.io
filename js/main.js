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

function PageCtrl(getPage, $scope){
  var ctrl = this,
      mtc = $scope.mtc;
  
  ctrl.page = getPage;
  mtc.page = ctrl.page;
  mtc.post = false;
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
   
function resumeDirective($sce, $compile){
  return {
    restrict: 'AE',
    replace: 'true',
    template: '<div><canvas id="resume" style="border: 1px solid black;"></canvas></div>',
    link: function(scope, elem, attrs){
      
    // Check if requestAnimationFrame is supported  
      (function () {
          var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
          window.requestAnimationFrame = requestAnimationFrame;
      })();
      
      var actorChars = {
        "@": Player,
        "o": Coin,
        "=": Lava,
        "|": Lava,
        "v": Lava
      };
      
      function Level(plan) {
        this.width = plan[0].length;
        this.height = plan.length;
        this.grid = [];
        this.actors = [];
        
        for(var y = 0; y < this.height; y++){
          var line = plan[y], gridLine = [];
          for (var x=0; x<this.width; x++){
            var ch = line[x], fieldType = null;
            var Actor = actorChars[ch];
            if(Actor){
              this.actors.push(new Actor(new Vector(x,y), ch));
            }
            else if (ch == "x"){
              fieldType = "wall";
            }
            else if (ch == "!"){
              fieldType = "lava";
            }
            gridLine.push(fieldType);
          }
          this.grid.push(gridLine);
        }
        
        this.player = this.actors.filter(function(actor){
          return actor.type == "player";
        })[0];
        this.status = this.finishDelay = null;
      }
      Level.prototype.isFinished = function(){
          return this.status != null && this.finishDelay < 0;
        };
      
      function Vector(x,y){
        this.x = x; this.y = y;
      }
      Vector.prototype.plus = function(other){
          return new Vector(this.x + other.x, this.y + other.y);
        };
      Vector.prototype.times = function(factor) {
          return new Vector(this.x * factor, this.y * factor)
      };
        
      function Player(pos){
        this.pos = pos.plus(new Vector(0, -0.5));
        this.size = new Vector(0.8, 1.5);
        this.speed = new Vector(0,0);
      }
      Player.prototype.type = "player";
      
      function Lava(pos, ch) {
        this.pos = pos;
        this.size = new Vector(1, 1);
        if (ch == "=") {
          this.speed = new Vector(2, 0);
        } else if (ch == "|") {
          this.speed = new Vector(0, 2);
        } else if (ch == "v") {
          this.speed = new Vector(0, 3);
          this.repeatPos = pos;
        }
      }
      Lava.prototype.type = "lava";
        
      function Coin(pos) {
        this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
        this.size = new Vector(0.6, 0.6);
        this.wobble = Math.random() * Math.PI * 2;
      }
      Coin.prototype.type = "coin";
        
        var simpleLevelPlan = [
          "                      ",
          "                      ",
          "                  xx  ",
          "xxx         o o    x  ",
          "  x@    x  xxxxx   x  ",
          "  xxxxx            x  ",
          "      x!!!!!!!!!!!!x  ",
          "      xxxxxxxxxxxxxx  ",
          "                      "
        ],
            simpleLevel = new Level(simpleLevelPlan);
      console.log(simpleLevel);
      
    // Define basic variables
      var canvas = $(elem).children()[0],
          ctx = canvas.getContext("2d"),
          tile = 20,
          width = simpleLevel.width * tile,
          height = simpleLevel.height * tile,
          player = {
              x: simpleLevel.player.pos.x * tile,
              y: simpleLevel.player.pos.y * tile,
              width: simpleLevel.player.size.x * tile,
              height: simpleLevel.player.size.x * tile,
              speed: 3,
              velX: 0,
              velY: 0,
              jumping: false,
              grounded: false
          },
          keys = [],
          friction = 0.8,
          gravity = 0.3,
          score = 0;

      var boxes = [];

      // Canvas walls
      boxes.push({
          x: 0,
          y: 0,
          width: tile,
          height: height,
          color: 'black'
      });
      boxes.push({
          x: 0,
          y: height-tile,
          width: width,
          height: tile,
          color: 'black'
      });
      boxes.push({
          x: width-tile,
          y: 0,
          width: tile,
          height: height,
          color: 'black'
      });
      boxes.push({
          x: 0,
          y: 0,
          width: width,
          height: tile,
          color: 'black'
      });
      
      for(var ii=0; ii<simpleLevel.grid.length; ii++){
        var line = simpleLevel.grid[ii];
        for(var i=0; i < line.length; i++){
          var tileEl = line[i];
          var obj = {
            x: tile * i,
            y: tile * ii,
            width: tile,
            height: tile,
            color: 'white'
          };
          if(tileEl === 'wall'){
            obj.color = 'blue';
            boxes.push(obj);
          }
          else if (tileEl === 'lava'){
            obj.color = 'red';
            boxes.push(obj);
          }
        }
      };
      
      angular.forEach(simpleLevel.actors, function(actor){
        if(actor.__proto__.type === 'coin'){
          boxes.push({
            x: actor.pos.x * tile,
            y: actor.pos.y * tile,
            width: actor.size.x * tile,
            height: actor.size.y * tile,
            color: 'yellow',
            cleared: false
          })
        }
      });
      

      canvas.width = width;
      canvas.height = height;

      function update() {
          // check keys
          if (keys[38] || keys[32]) {
              // up arrow or space  
            if (!player.jumping && player.grounded) {
                  player.jumping = true;
                  player.grounded = false;
                  player.velY = -player.speed * 2;
              }
          }
          if (keys[39]) {
              // right arrow
              if (player.velX < player.speed) {             player.velX++;         }     }
          if (keys[37]) {         // left arrow
            if (player.velX > -player.speed) {
                  player.velX--;
              }          
          }

          player.velX *= friction;
          player.velY += gravity;

          // Reset the canvas
          ctx.clearRect(0, 0, width, height);
          ctx.beginPath();
          player.grounded = false;
        
          // Draw all the canvas elements
          for (var i = 0; i < boxes.length; i++) {
              if(!boxes[i].cleared){
                ctx.fillStyle = boxes[i].color;
                ctx.rect(boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
                ctx.fill();
                ctx.beginPath();
                // Check for collisions
                var dir = colCheck(player, boxes[i]);
              }
            
             // Check if the collided element is hard or not
             if(boxes[i].color !== 'yellow' && dir !== null){
               // Check collision direction
               if(boxes[i].color === 'red'){
                 console.log('Ouch!');
               }
               if (dir === "l" || dir === "r") {
                    player.velX = 0;
                    player.jumping = false;
                } else if (dir === "b") {
                    player.grounded = true;
                    player.jumping = false;
                } else if (dir === "t") {
                    player.velY *= -1;
                }
            } else if(boxes[i].color === 'yellow' && dir !== null) {
              // Clear the collided element if soft
              score++;
              if(score < 2)
                console.log('score:', score);
              else
                console.log('You win!');
              boxes[i].cleared = true;
              ctx.fillStyle = 'white';
              ctx.clearRect(boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
              ctx.fill();
              ctx.beginPath();
            }
          }

          if(player.grounded){
               player.velY = 0;
          }

          player.x += player.velX;
          player.y += player.velY;

          ctx.fill();
          ctx.fillStyle = "black";
          ctx.fillRect(player.x, player.y, player.width, player.height);

          requestAnimationFrame(update);
      }

      function colCheck(shapeA, shapeB) {
          var vX = (shapeA.x + (shapeA.width / 2)) - (shapeB.x + (shapeB.width / 2)),
              vY = (shapeA.y + (shapeA.height / 2)) - (shapeB.y + (shapeB.height / 2)),
              hWidths = (shapeA.width / 2) + (shapeB.width / 2),
              hHeights = (shapeA.height / 2) + (shapeB.height / 2),
              colDir = null,
              oX,
              oY;
        
          if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
            oX = hWidths - Math.abs(vX);
            oY = hHeights - Math.abs(vY);                 if (oX >= oY) {
              if (vY > 0) {
                  colDir = "t";
                  shapeA.y += oY;
              } else {
                  colDir = "b";
                  shapeA.y -= oY;
              }
            } else {
              if (vX > 0) {
                  colDir = "l";
                  shapeA.x += oX;
              } else {
                  colDir = "r";
                  shapeA.x -= oX;
              }
            }
          }
          return colDir;
      }

      document.body.addEventListener("keydown", function (e) {
          keys[e.keyCode] = true;
      });

      document.body.addEventListener("keyup", function (e) {
          keys[e.keyCode] = false;
      });

      window.addEventListener("load", function () {
          update();
      });
    }
  };
}
   
   
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
.run(function($rootScope){
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

.controller('PostsCtrl', PostsCtrl)
.controller('PostIndexCtrl', PostIndexCtrl)
.controller('PostCtrl', PostCtrl)
.controller('PageCtrl', PageCtrl)
.controller('MtcCtrl', MtcCtrl)
.controller('SandwichCtrl', SandwichCtrl)

.service('SiteService', SiteService)

.directive('resume', resumeDirective)
.directive('compile', compile)
;
