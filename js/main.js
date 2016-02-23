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
    var r,
        url = $location.url();
    url.indexOf(p.url) > -1 ? r = 'active' : r = '';
    return r;
  }
}

function PostsCtrl($scope, SiteService, $timeout){
  var ctrl = this,
      mtc = $scope.mtc,
      li;
  
  // Define posts array
  ctrl.posts = SiteService.posts;
  
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

function PostIndexCtrl(SiteService, $scope, $location, $timeout){
  var ctrl = this,
      url = '/posts/',
      promise;
  promise = SiteService.getPage(url);
  promise.then(
    function(result){
      ctrl.page = result;
      $scope.mtc.page = ctrl.page;
      $scope.mtc.post = false;
      $scope.p.activePost = undefined;
      $scope.p.scrollTo('top');
    },
    function(error){
      console.log(error);
      $location.path('/404/');
    },
    function(update){
      console.log('update');
    });
  
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

function PostCtrl(SiteService, $stateParams, $location, $scope){
  
  var ctrl = this,
      id = $stateParams.id,
      mtc = $scope.mtc,
      promise = SiteService.getPost(id);
  
  promise.then(
    function(result){
      ctrl.post = result;
      $scope.p.scrollTo('top');
      if($scope.p.activePost !== ctrl.post){
        $scope.p.activePost = ctrl.post;
      }
      ctrl.post.isFirst = ctrl.post.previous === '';
      ctrl.post.isLast = ctrl.post.next === '';
      mtc.page = ctrl.post
      mtc.post = true;
  },
    function(reason){
      console.log(reason);
      $location.path('/404/');
  },
    function(update){
      console.log(update);
  });
}

function PageCtrl(SiteService, $stateParams, $location, $scope){
  var ctrl = this,
      mtc = $scope.mtc,
      url = $location.url(),
      promise;   
  mtc.page = undefined;
  promise = SiteService.getPage(url);
  promise.then(
    function(result){
      ctrl.page = result;
      mtc.page = ctrl.page;
      mtc.post = false;
    },
    function(error){
      console.log(error);
      $location.path('/404/');
    },
    function(update){
      console.log('update');
    });
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
      "cover": '{{ page.cover }}'
    },
    {% endfor %}
    {
      "index": 2,
      "url": '{{ site.baseurl }}/posts/',
      "id": 'posts.index',
      "title": 'Posts',      
      "media": '/img/building.jpg',
      "content": '',
      "cover": '/img/building.jpg'
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
   
// Configuration

function stateRouter($stateProvider, $urlRouterProvider) {
  
  $urlRouterProvider.otherwise('/404/');
  
  $stateProvider
    .state('posts', {
      url: '/posts',
      abstract: true,
      template: '<div ui-view class="post-view"></div>',
      controller: 'PostsCtrl',
      controllerAs: 'p'
    })
    
    .state('posts.index', {
      url: '/',
      templateUrl: 'views/posts.html',
      controller: 'PostIndexCtrl',
      controllerAs: 'posts',
      parent: 'posts'
    })
     
    .state('posts.post', {
      url: '/:id',
      templateUrl: 'views/post.html',
      controller: 'PostCtrl',
      controllerAs: 'post',
      parent: 'posts'
    })
  
    {% for page in site.pages %}
    .state(('{{ page.path }}').slice(0,('{{ page.path }}').lastIndexOf('.')) , {
      url: '{{ page.url }}',
      templateUrl: 'views/page.html',
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
        close_on_click: true
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

// .directive('directive', directive)
;
