var moment = require('moment');

export default function(guanineApp) {
    guanineApp.controller('CourseDetailCtrl', ['$scope', 'Restangular', '$location', '$routeParams', '$mdDialog', '$mdLoginToast',
        function($scope, Restangular, $location, $routeParams, $mdDialog, $mdLoginToast) {

            $scope.assessment = {};
            $scope.end_minDate="";
            $scope.multiple_submissions="Allowed";
            var checked_filter = {"Allowed": true, "Not allowed": false};

            // prevent choosing an end date that is earlier than the start date
            $scope.$watch('assessment.start_date', function(newValue, oldValue) {
                if (newValue) {
                    $scope.end_minDate = moment(newValue).toDate();
                    if ($scope.assessment.end_date && (newValue > $scope.assessment.end_date)) {
                        $scope.assessment.end_date = null;
                    }
                }
            });

            Restangular.one('courses', $routeParams.courseID).get().then(function(data) {
                $scope.course = data;
                // minDate/maxDate for min and max dates for assessments
                $scope.start_minDate = moment($scope.course.start_date).toDate();
                $scope.end_minDate = moment($scope.course.start_date).toDate();
                $scope.maxDate = moment($scope.course.end_date).toDate();
                $scope.date_progress = $scope.find_date_progress();
            });

            $scope.options = {
                limitSelect: true,
                pageSelect: true
            };

            $scope.query = {
                limit: 10,
                page: 1,
                order: 'name',
            };

            // go to student detail
            $scope.go = function(id) {
                $location.path('/courses/' + $routeParams.courseID + '/students/' + id);
            };

            // determine calendar progress
            $scope.find_date_progress = function() {
                var begin = moment($scope.course.start_date).format('x');
                var end = moment($scope.course.end_date).format('x');
                var now = moment().format('x');
                return (now-begin)/(end-begin)*100;
            };

            $scope.assessmentPopup = function(ev) {
                $mdDialog.show({
                    contentElement: '#assessment_card',
                    parent: angular.element(document.body),
                    clickOutsideToClose: true
                });
            };

            $scope.cancel = function() {
                $mdDialog.cancel();
            };

            $scope.submit = function() {
                Restangular.all('assessments').post({
                    course: $scope.course.id,
                    title: $scope.assessment.title,
                    description: $scope.assessment.description,
                    start_date: moment($scope.assessment.start_date).format('YYYY-MM-DD'),
                    end_date: moment($scope.assessment.end_date).format('YYYY-MM-DD'),
                    submit_multiple: checked_filter[$scope.multiple_submissions],
                })
                .then(function(course) {
                    $scope.assessment = {};
                    $scope.assessmentForm.$setUntouched();
                    $scope.cancel();
                    Restangular.one('courses', $routeParams.courseID).get().then(function(data) {
                        $scope.course = data;
                    });
                }, function() {
                    $mdLoginToast.show('Invalid assessment');
                });
            };

            $scope.student_result = function(results, student_id) {
                var r = [];
                results.forEach(function(result) {
                    if (result.student.id == student_id) {
                        r.push(result)
                    }
                });
                r.sort(function(a,b) {
                    if(a.submitted.valueOf() < b.submitted.valueOf()) return -1;
                    if(a.submitted.valueOf() > b.submitted.valueOf()) return 1;
                    return 0;
                });
                if (r.length) {
                    return r[r.length-1].points_earned/r[r.length-1].points_possible*100;
                }
            };
    }]);
}
