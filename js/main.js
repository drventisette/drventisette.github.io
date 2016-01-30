---
---

// Controllers

function MainCtrl(UserService){
  
  var vm = this;
  
  vm.removeFromStock = function (item, index) {
    vm.items.splice(index, 1);
  };
  
  vm.items = [{
    name: 'Scuba Diving Kit',
    id: 7297510
  },{
    name: 'Snorkel',
    id: 0278916
  },{
    name: 'Wet Suit',
    id: 2389017
  },{
    name: 'Beach Towel',
    id: 1000983
  }];
  
  vm.sayHello = function (name) {
    UserService.sayHello(name);
  };
  
  vm.showMessage = function(message) {
    vm.message = "Your message is: " + message;
  };
  
  vm.timeNow = Date.now();
}

function EmailCtrl ($routeParams, EmailService) {
  var vm = this;
  EmailService
    .get($routeParams.id)
    .then(function(response){
      vm.email = response;
  }, function(error){
      vm.error = error;
  });
}

function InboxCtrl(EmailService){
  this.emails = EmailService.emails;
}

function PostsCtrl(BlogService){
  this.posts = BlogService.posts;
}

// Services

function UserService(){
  this.sayHello = function (name) {
    return 'Hello there ' + name;
  };
}

function BlogService(){
  
  {% capture posts %}
  [
    {% for post in site.posts %}
    {
      "title": '{{ post.title }}',
      "url": '{{ site.baseurl }}{{ post.url }}',
      "date": '{{ post.date | date: "%d %B %Y" }}',
      "excerpt": '{{ post.excerpt | remove: "<p>" | remove : "</p>" | escape }}',
      "content": '{{ post.content | escape }}'
    }
    {% if forloop.last %}{% else %},{% endif %}
    {% endfor %}
  ];
  {% endcapture %}
  
  this.posts = {{ posts | strip_newlines }};
  
}

function EmailService($q){
  
  this.emails = [
    {
      id: "0",
      sender: "Jane",
      object: "Greeting",
      message: "Hello, my friend!"
    },
    {
      id: "1",
      sender: "John",
      object: "Goodbye",
      message: "Farewell, my friend!"
    },
    {
      id: "2",
      sender: "Barbara",
      object: "Question",
      message: "What?"
    },
    {
      id: "3",
      sender: "Admin",
      object: "This Website",
      message: "{{ site.url }}"
    }
  ];
  
  this.get = function(id){
    
    var deferred = $q.defer(),
        emails = this.emails,
        r = undefined,
        i=0;
    
    for(var i; i < emails.length; i++){
      var email = emails[i];
      if(email.id === id){
        r = email;
      }
    }
    
    if(email !== undefined){
      deferred.resolve(r);
    }
    else {
      deferred.reject("No email found");
    }
    return deferred.promise;
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
  .when('/inbox', {
    templateUrl: 'views/inbox.html',
    controller: 'InboxCtrl',
    controllerAs: 'inbox'
  })
  .when('/inbox/email/:id', {
    templateUrl: 'views/email.html',
    controller: 'EmailCtrl',
    controllerAs: 'email'
  })
  .when('/posts', {
    templateUrl: 'views/posts.html',
    controller: 'PostsCtrl',
    controllerAs: 'posts'
  })
  .otherwise({
    redirectTo: '/inbox'
  });
}

// App definition

var app = angular

.module('myApp', ['ngRoute'], function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
})

.controller('MainCtrl', MainCtrl)
.controller('InboxCtrl', InboxCtrl)
.controller('EmailCtrl', EmailCtrl)
.controller('PostsCtrl', PostsCtrl)

.service('UserService', UserService)
.service('EmailService', EmailService)
.service('BlogService', BlogService)

.directive('composeEmail', composeEmail)

.config(router);

