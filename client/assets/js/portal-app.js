angular.module('portal', ['ngRoute'])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

        // routing definitions
    $routeProvider
        .when('/', {
            templateUrl: '/views/login.html',
            controller: 'loginController'
        })
        .when('/home', {
            templateUrl: '/views/home.html',
            controller: 'homeController'
        })
        .when('/profile/:email', {
            templateUrl: '/views/profile.html',
            controller: 'profileController'
        })
        .when('/project/:projectId', {
            templateUrl: '/views/project.html',
            controller: 'projectController'
        })
        .when('/admin', {
            templateUrl: '/views/admin.html',
            controller: 'adminController'
        })
        .otherwise({
            redirectTo: '/'
        });

        // remove # from URL
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    }
])
.directive('headerInclude', function() {
    return {
        restrict: 'E',
        templateUrl: '/views/header.html',
        controller: 'headerController'
    };
})
.directive('loaderInclude', function() {
    return {
        restrict: 'E',
        templateUrl: '/views/loader.html'
    };
});
