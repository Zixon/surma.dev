define([
  'jquery',
  'underscore',
  'backbone',
  'models/social_element'
  ], function($, _, Backbone, SocialElement) {


    var Identity = Backbone.Collection.extend({
      model: SocialElement,

      initialize: function(models, options) {
        this.identity_string = options.identity_string;
        // this.comparator = comparatorFunc;
        this.sort();
      },

      comparator: function(socialelement) {
        return socialelement.get('position');
      },
    });
    return Identity;
});
