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

function PostsCtrl($scope, SiteService){
  var ctrl = this,
      mtc = $scope.mtc,
      li;
  
  ctrl.posts = SiteService.posts;
  
  angular.forEach(ctrl.posts, function(post){
    post.isActive = false;
  });
  
  $scope.$watch('ctrl.posts', function(newVal, oldVal){
    ctrl.activePost = false;
    angular.forEach(newVal, function(post){
      if(post.isActive){
        ctrl.activePost = post;
      }
    });
    console.log(ctrl.posts);
  }, true);
  
  ctrl.scrollToActive = function(target){
    target = $(target);
    var container = $('.text-content'),
        li = target.parents('.accordion-navigation'),
        parent = $('.accordion'),
        position = li.prevAll('.accordion-navigation').length,
        offsetTop;
    
    offsetTop = parent.position().top + (li.height() * position);
    container.animate({
      scrollTop: offsetTop
    }, "slow");
  };
}

function PostIndexCtrl($scope, $anchorScroll, $location, $animate){
  var ctrl = this,
      mtc = $scope.mtc;
    
  mtc.post = false;
  
  ctrl.toggleAccordion = function(post, e){
    var t;
    
    post = post || 'all';
    
    if(post !== 'all'){
      t = !post.isActive;
    }
    
    angular.forEach($scope.p.posts, function(p){
      if(p === post){
        post.isActive = t;
      }
      else
      {
        p.isActive = false;
      }
    });
    
    if(post !== 'all' && e.target.className.indexOf('label') === -1){ 
      
      if(t){
        $scope.p.scrollToActive(e.target);
      }
    }
  };
  
  ctrl.toggleFilter = function(tag, e){
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
      ctrl.post.isFirst = ctrl.post.previous === '';
      ctrl.post.isLast = ctrl.post.next === '';
      mtc.page = ctrl.post
      mtc.post = true;
      $('.text-content').animate({
        scrollTop: 0
      }, "slow");
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
      "url": '{{ site.baseurl }}/posts',
      "id": 'posts.index',
      "title": 'Posts',      
      "media": '',
      "content": '',
      "cover": ''
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
      template: '<div ui-view></div>',
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
