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
    ctrl.page = newV;
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

function PostsCtrl(SiteService, $scope){
  this.posts = SiteService.posts;
  $scope.mtc.post = undefined;
  $scope.mtc.page = {
    title: 'Post Index'
  };
  $(document).foundation('clearing', 'reflow');
}

function PostCtrl(SiteService, $routeParams, $location, $scope){
  
  var ctrl = this,
      url = '/posts/' + $routeParams.y + '/' + $routeParams.m + '/' + $routeParams.d + '/' + $routeParams.title + '/',
      promise = SiteService.getPost(url);
  
  $scope.mtc.post = undefined;
  
  promise.then(
    function(result){
      ctrl.post = result;
      ctrl.post.isFirst = ctrl.post.previous === '';
      ctrl.post.isLast = ctrl.post.next === '';
      $scope.mtc.page = ctrl.post;
      $scope.mtc.post = true;
  },
    function(reason){
      console.log(reason);
      $location.path('/404/');
  },
    function(update){
      console.log(update);
  });
}

function PageCtrl(SiteService, $routeParams, $location, $scope){
  var ctrl = this,
      url = $location.url(),
      promise = SiteService.getPage(url);
  
  $scope.mtc.page = undefined;
  
  promise.then(
    function(result){
      ctrl.page = result;
      $scope.mtc.page = ctrl.page;
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
      "index": '{{ page.index }}',
      "url": '{{ site.baseurl }}{{ page.url }}',
      "path": '{{ page.path }}',
      "title": '{{ page.title }}',
      "date": '{{ page.date | date: "%d %B %Y" }}',
      "categories": ('{{ page.categories }}').split(','),
      "tags": '{{ page.tags }}',
      "excerpt": helpers.DecodeHtml('{{ page.excerpt | remove: "<p>" | remove : "</p>" | escape }}'),
      "media": '{{ page.media }}',
      "content": helpers.DecodeHtml('{{ page.content | escape }}'),
      "cover": '{{ page.cover }}'
    }
    {% if forloop.last %}{% else %},{% endif %}
    {% endfor %}
  ];
  {% endcapture %}
  
  this.pages = {{ pages | strip_newlines }};
  
  // Site's posts
  {% capture posts %}
  [
    {% for post in site.categories.posts %}
    {
      "id": '{{ post.id }}',
      "title": '{{ post.title }}',
      "url": '{{ site.baseurl }}{{ post.url }}',
      "date": '{{ post.date | date: "%d %B %Y" }}',
      "excerpt": helpers.DecodeHtml('{{ post.excerpt | remove: "<p>" | remove : "</p>" | escape }}'),
      "media": '{{ post.media }}',
      "content": helpers.DecodeHtml('{{ post.content | escape }}'),
      "cover": '{{ post.cover }}',
      "previous": '{{ post.previous.id }}',
      "next": '{{ post.next.id }}'
    }
    {% if forloop.last %}{% else %},{% endif %}
    {% endfor %}
  ];
  {% endcapture %}
  
  this.posts = {{ posts | strip_newlines }};
  
  this.getPost = function(url){
    var deferred = $q.defer(),
        result,
        error;
    deferred.notify('Looking for ' + url + '...');
    if(result = helpers.get(url, this.posts, 'url'))
    {
      deferred.resolve(result);
    }
    else
    {
      error = 'Unable to find ' + url + '.';
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

function router ($routeProvider) {
  $routeProvider
  .when('/posts/:y/:m/:d/:title', {
    templateUrl: 'views/post.html',
    controller: 'PostCtrl',
    controllerAs: 'post'
  })
  
  {% for page in site.pages %}
  .when('{{ page.url }}', {
    templateUrl: 'views/page.html',
    controller: 'PageCtrl',
    controllerAs: 'page'
  })
  {% endfor %}
  
  .when('/posts/', {
    templateUrl: 'views/posts.html',
    controller: 'PostsCtrl',
    controllerAs: 'posts'
  })
  
  .otherwise({
    redirectTo: '/404/'
  });

}

// App definition

var app = angular

.module('myApp', ['ngRoute', 'ngResource'], function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
})

.filter("sanitize", ['$sce', function($sce) {
  return function(htmlCode) {
    return $sce.trustAsHtml(htmlCode);
  };
}])

.controller('PostsCtrl', PostsCtrl)
.controller('PostCtrl', PostCtrl)
.controller('PageCtrl', PageCtrl)
.controller('MtcCtrl', MtcCtrl)
.controller('SandwichCtrl', SandwichCtrl)

.service('SiteService', SiteService)

// .directive('directive', directive)

.config(router);

