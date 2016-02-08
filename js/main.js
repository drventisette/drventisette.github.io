---
title: main.js
---
  
// Helper functions
function DecodeHtml(str) {
  return $('<div/>').html(str).text();
}
  
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
}

function PostCtrl(SiteService, $routeParams, $location, $scope){
  var url = '/posts/' + $routeParams.y + '/' + $routeParams.m + '/' + $routeParams.d + '/' + $routeParams.title + '/';
  $scope.mtc.post = undefined;
  this.post = SiteService.getPost(url);
  if(this.post === undefined){
    $location.path('/');
  }else{
    this.post.isFirst = this.post.previous === '';
    this.post.isLast = this.post.next === '';
    $scope.mtc.page = this.post;
    $scope.mtc.post = true;
  }
}

function PageCtrl(SiteService, $routeParams, $location, $scope){
  var url = $location.url();
  $scope.mtc.page = undefined;
  this.page = SiteService.getPage(url);
  if(this.page === undefined){
    $location.path('/');
  }else{
    $scope.mtc.page = this.page;
  }
}

// Services
function SiteService(){

  this.time = '{{ site.time }}';
  
  // Site's pages
  
  {% capture pages %}
  {% assign site-pages = (site.pages | where: "layout", "mtc") %}
  [
    {% for page in site-pages %}
    {
      "id": '{{ page.id }}',
      "url": '{{ site.baseurl }}{{ page.url }}',
      "path": '{{ page.path }}',
      "title": '{{ page.title }}',
      "date": '{{ page.date | date: "%d %B %Y" }}',
      "categories": ('{{ page.categories }}').split(','),
      "tags": '{{ page.tags }}',
      "excerpt": DecodeHtml('{{ page.excerpt | remove: "<p>" | remove : "</p>" | escape }}'),
      "media": '{{ page.media }}',
      "content": DecodeHtml('{{ page.content | escape }}'),
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
      "excerpt": DecodeHtml('{{ post.excerpt | remove: "<p>" | remove : "</p>" | escape }}'),
      "media": '{{ post.media }}',
      "content": DecodeHtml('{{ post.content | escape }}'),
      "cover": '{{ post.cover }}',
      "previous": '{{ post.previous.id }}',
      "next": '{{ post.next.id }}'
    }
    {% if forloop.last %}{% else %},{% endif %}
    {% endfor %}
  ];
  {% endcapture %}
  
  this.posts = {{ posts | strip_newlines }};
  
  var get = function(url, p){
    var result = undefined;
    for(var i=0; i<p.length; i++){
      var test = p[i];      
      if(test.url === url){
        result = test;
      }
    }
    return result;
  };
  
  this.getPost = function(url){
    return get(url, this.posts);
  };
  
  this.getPage = function(url){
    return get(url, this.pages);
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

