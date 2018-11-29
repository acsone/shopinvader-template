$(document).ready(function() {
  var instantsearch_params = {
    indexName: algolia_params.products_index,
    urlSync: true,
    templatesConfig: {
      compileOptions: [{delimiters: '<% %>'}]
    }
  };
  if(algolia_params.currency_rate != 1 && typeof(customSearchClient) != 'undefined') {
    //Add customSearchClient necessary for currency conversion
    instantsearch_params.searchClient = customSearchClient;
  }
  else {
    instantsearch_params.appId = algolia_params.app_id;
    instantsearch_params.apiKey = algolia_params.api_key;
  }
  if($('#search-result').attr('data-category') != undefined) {
    if($('#search-result').attr('data-category')) {
      instantsearch_params.searchParameters= {
        facetsRefinements: {
          'categories.id': [$('#search-result').attr('data-category')]
        },
        facets: ['categories.id']
      };
    }
  }

  var search = instantsearch(instantsearch_params );

  search.addWidget(
    instantsearch.widgets.stats({
      container: '#search-stats',
      templates: {
        body: $('#stats-template').html()
      }
    })
  );
  var page_hits_count = [];
  default_item = true;
  for(i=6; i <=48; i=i+6) {
    page_hits_count.push(
      {
        value:i,
        label: i+' '+ algolia_params.translations.per_page,
        default: default_item,
      }
    );
    default_item = false;
  }

  search.addWidget(
    instantsearch.widgets.hitsPerPageSelector({
      container: '#hits-per-page-selector',
      autoHideContainer: false,
      items: page_hits_count,
      cssClasses: {
        select: " form-control"
      }
    })
  );
  search.addWidget(
    instantsearch.widgets.hierarchicalMenu({
      container: '#hierarchical-categories',
      attributes: ['hierarchicalCategories.lvl0', 'hierarchicalCategories.lvl1', 'hierarchicalCategories.lvl2'],
      autoHideContainer: false,
      showParentLevel: true,
      templates: {
        header: "<h4 class='text-uppercase'>Category</h4>",
      },
    })
  );

  var filters = [];

  filters.push({name:'hierarchicalCategories.lvl0', label: 'Category'});
  search.addWidget(
    instantsearch.widgets.rangeSlider({
      container: '#filter-sliderprice',
      attributeName: 'price.'+default_role+'.value',
      autoHideContainer: false,
      searchForFacetValues: true,
      templates: {
        header: "<h4>"+algolia_params.translations.price+"</h4>",
      },
      collapsible: {
        collapsed: false,
      },

      tooltips: {
        format: function(rawValue) {
          var number = new Number(rawValue);
          return number.toLocaleString(
            algolia_params.locale_code,
            {
              style: "currency",
              currency: algolia_params.currency_code,
            }
          );
        }
      }
    })
  );
  filters.push({name:'price.'+default_role+'.value', label: algolia_params.translations.price});

  search.addWidget(
    instantsearch.widgets.priceRanges({
      container: '#filter-rangeprice',
      attributeName: 'price.default.value',
      labels: {
        currency: algolia_params.currency_symbol+' ',
        separator: '-',

      },
      autoHideContainer: false,
      cssClasses: {
        button: 'pr-1 btn btn-sm btn-outline-primary',
        input: ' form-control',
        form: ' input-group',
        label: ' text-dark small',
      }
    })
  );


  $('[data-filter-attr]').each(
  function(i, element){
    var $element = $(element);
    var search_widget = {
      container: '[data-filter-id="' + $element.data('filter-id')+ '"]',
      attributeName: $element.data('filter-attr'),
      sortBy: ['isRefined', 'name:asc'],
      operator: 'or',
      templates: {
        header: '<h4 class="text-uppercase">'+$element.data('filter-name')+'</h4>'
      },
      showMore: {
        limit: 100
      },
      collapsible: {
        collapsed: false,
      },
      autoHideContainer: false
    };
    search.addWidget(instantsearch.widgets[$element.data('filter-widget-type')](search_widget));
    filters.push({name: $element.data('filter-attr'), label: $element.data('filter-name')});
  });

  $('[data-current-filter]').each(
  function(i, element) {
    search.addWidget(
      instantsearch.widgets.currentRefinedValues({
        container: ('#'+$(element).attr('id')),
        clearAll: 'after',
        clearsQuery: true,
        attributes: filters,
        cssClasses: {
          count: ' d-none',
          clearAll: ' btn btn-outline-dark btn-sm  btn-sm  d-inline-block'
        },
        templates: {
          clearAll: algolia_params.translations.clear_all
        },
        transformData : {
          item: function(element) {
            element.name = "<b>"+element.name+"</b> <i class='fa fa-times pl-1'></i>"
            return element;
          }
        },
        autoHideContainer: false,
        onlyListedAttributes: true
      })
    );
  });

  var product_item_css = $('#search-result .product-col').first().attr('class');
  var product_root_css = $('#search-result .row').first().attr('class');

  search.addWidget(
    instantsearch.widgets.hits({
      container: '#search-result',
      hitsPerPage: 18,

      templates: {
        item: $('#product-hit-template').html(),
        empty: algolia_params.translations.result_empty
      },
      cssClasses: {
        root: product_root_css,
        item: product_item_css,
        empty: ' text-center m-4 p-4 lead  d-block'
      },
      transformData: {
        item: function(item) {
          item.last_categorie = item.categories[item.categories.length-1];
          item.price = item.price[default_role];
          if(item.variant_count > 0) {
            item.varianted = true;
          }
          else {
            item.varianted = false;
          }
          return item;
        }
      }
    })
  );

  search.addWidget(
    instantsearch.widgets.pagination({
      container: '#search-pagination-top',
      cssClasses: {
        root: 'pagination-block',
        link: 'btn btn-default '
      }
    })
  );
  search.addWidget(
    instantsearch.widgets.pagination({
      container: '#search-pagination-bottom',
      cssClasses: {
        root: 'pagination-block',
        link: 'btn btn-default '
      }
    })
  );
  search.templatesConfig.helpers.emphasis = function(text, render) {
    return '<em>' + render(text) + '</em>';
  };
  search.templatesConfig.helpers.currency = function(text, render) {
    var value = 0;
    if(typeof(render) != 'undefined') {

      value = parseFloat(render(text));
    }
    else {
      value = parseFloat(text);
    }

    n = new Number(value);


    return n.toLocaleString(algolia_params.locale_code,
      {
        style: "currency",
        currency: algolia_params.currency_code
      }
    );
  };

  search.templatesConfig.helpers.imageDefault = function(text, render) {
    var url = render(text).trim();
    if(url != '') {
      return render(text);
    }
    else {

      return default_img_url;
    }
  };

  search.templatesConfig.helpers.ratingsStars = function(text, render) {
    var html = '';
    var value = parseInt(render(text));
    if(isNaN(value)) {
      return '&nbsp;';
    }
    var n = 1;
    for(n; n <= 5; n++){
      if(n <= value) {
        html += '<i class="fas fa-star" aria-hidden="true"></i>';
      }
      else {
        html += '<i class="far fa-star" aria-hidden="true"></i>';
      }
    }
    return '<div class="rating">'+html+'</div>';
  };

  search.start();

});
