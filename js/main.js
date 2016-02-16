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

function PostsCtrl(SiteService, $scope, $anchorScroll, $location, $animate){
  var ctrl = this,
      mtc = $scope.mtc;
  ctrl.accordion = {};
  ctrl.posts = SiteService.posts;
    mtc.post = false;
    mtc.page = {
      title: 'Post Index'
    };
  
  
  ctrl.toggleAccordion = function(id, e){
    var section = id,
        t;
    if(e.target.className.indexOf('label') === -1){
      t = !ctrl.accordion[section];
      for(var i=0; i<ctrl.posts.length; i++){
        ctrl.accordion[ctrl.posts[i].id] = false;
      }
      ctrl.accordion[section] = t;
      if(t){
        var container = $('.text-content'),
            target = $(e.target),
            parent;
        
        parent = target.parents('.accordion-navigation');
        container.animate({
          scrollTop: parent.position().top
        }, "slow");
      }
    }
  };
  
  ctrl.toggleFilter = function(tag, e){
    ctrl.filter === tag ? ctrl.filter = '' : ctrl.filter = tag;
  };
}

function PostCtrl(SiteService, $routeParams, $location, $scope){
  
  var ctrl = this,
      url = '/posts/' + $routeParams.y + '/' + $routeParams.m + '/' + $routeParams.d + '/' + $routeParams.title + '/',
      mtc = $scope.mtc,
      promise = SiteService.getPost(url);
  
  promise.then(
    function(result){
      ctrl.post = result;
      ctrl.post.isFirst = ctrl.post.previous === '';
      ctrl.post.isLast = ctrl.post.next === '';
      mtc.page = ctrl.post;
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

function PageCtrl(SiteService, $routeParams, $location, $scope){
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
      "tags": ('{{post.tags}}').split(','),
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

.module('myApp', ['ngRoute', 'ngResource', 'ngAnimate'], function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
})
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
.controller('PostCtrl', PostCtrl)
.controller('PageCtrl', PageCtrl)
.controller('MtcCtrl', MtcCtrl)
.controller('SandwichCtrl', SandwichCtrl)

.service('SiteService', SiteService)

// .directive('directive', directive)
.config(router);

