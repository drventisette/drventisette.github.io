---
---
// Helper functions
function DecodeHtml(str) {
  return $('<div/>').html(str).text();
}
  
// Controllers

function PostsCtrl(BlogService){
  this.posts = BlogService.posts;
}

function PostCtrl(BlogService, $routeParams, $location){
  var id = '/' + $routeParams.y + '/' + $routeParams.m + '/' + $routeParams.d + '/' + $routeParams.title;
  this.post = BlogService.get(id);
  if(this.post === undefined){
    $location.path('/');
  }else{
    var encodedStr = this.post.content;
    this.post.content = DecodeHtml(encodedStr);
  }
}

// Services

function BlogService(){
  
  {% capture posts %}
  [
    {% for post in site.posts reversed %}
    {
      "id": '{{ post.id }}',
      "title": '{{ post.title }}',
      "url": '{{ site.baseurl }}{{ post.url }}',
      "date": '{{ post.date | date: "%d %B %Y" }}',
      "excerpt": '{{ post.excerpt | remove: "<p>" | remove : "</p>" | escape }}',
      "content": '{{ post.content | escape }}',
      "previous": '{{ post.previous }}',
      "next": '{{ post.next }}'
    }
    {% if forloop.last %}{% else %},{% endif %}
    {% endfor %}
  ];
  {% endcapture %}
  
  this.posts = {{ posts | strip_newlines }};
  this.get = function(id){
    var result = undefined;
    for(var i=0; i<this.posts.length; i++){
      var test = this.posts[i];      
      if(test.id === id){
        result = test;
      }
    }
    return result;
  }
}

// Directives

function composeEmail () {
  return {
    restrict: 'EA',
    replace: true,
    scope: true,
    controllerAs: 'compose',
    controller: function () {

    },
    link: function ($scope, $element, $attrs) {

    },
    template: [
      '<div class="compose-email">',
        '<input type="text" placeholder="To..." ng-model="compose.to">',
        '<input type="text" placeholder="Subject..." ng-model="compose.subject">',
        '<textarea placeholder="Message..." ng-model="compose.message"></textarea>',
      '</div>'
    ].join('')
  };
}

// Configuration

function router ($routeProvider) {
  $routeProvider
  .when('/posts', {
    templateUrl: 'views/posts.html',
    controller: 'PostsCtrl',
    controllerAs: 'posts'
  })
  .when('/posts/:y/:m/:d/:title', {
    templateUrl: 'views/post.html',
    controller: 'PostCtrl',
    controllerAs: 'post'
  })
  .otherwise({
    redirectTo: '/posts'
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

.service('BlogService', BlogService)

.directive('composeEmail', composeEmail)

.config(router);

