;(function() {
	$.fn.layerShow = function() {
		$($(this).data('target')).addClass('active');
	};

	$.fn.layerHide = function() {
		$(this).closest('.layer').removeClass('active');
	};

	var DATA_BASE = null,
		DATA_LIVE = null;

	var $btnRegion = $('.btn-region'),
		$layerRegion = $('.layer-region'),
		$formRegion = $('#regions'),
		$selectNiro = $('#select-niro-trim')
		$layerAddCar = $('.layer-add-car'),
		$formAddCar = $layerAddCar.find('.select-car'),
		carSelectData = {
			region:null,
			cars:[]
		},
		carIndex = 0;

	function numberWithCommas(val) {
		val = val <= 0 ? 0 : val;
		return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	function init() {
		$.when(
			//real
			//$.getJSON('/resource/data/niro_calc_data.json'),
			//$.getJSON('/manager/proxy/data') //NOTE: live - /manager/proxy/data , data - /resource/data/niro_live_calc_data.json

			//dev
			$.getJSON('http://niro.kia.com/resource/data/niro_calc_data.json'),
			$.getJSON('http://niro.kia.com/manager/proxy/data')
		).done(loadJSON);
	}

	function loadJSON(base, live) {
		DATA_BASE = base[0];
		DATA_LIVE = live[0];

		var _niroTrims = DATA_BASE.cars.NIRO.models.hybrid.trims,
			_data = _.extend({
				niro:_niroTrims
			}, {
				setPrice:numberWithCommas
			}),
			template = _.template($('#select-noro').html());

		$selectNiro.html(template(_data)).on('click', 'input', selectNiro);

		$btnRegion.on('click', function(e) {
			$layerRegion.addClass('active')
				.closest('.layer').find('.btn-layer-close')
				.on('click', function() {
					$(this).closest('.layer').removeClass('active');
				});

			e.preventDefault();
		});

		$formRegion.on('submit', function(e) {
			var fields = $(':input:checked', this),
				$map = $('.selected-region'),
				$next = $('[data-steps="2"]');

			if(fields.length <= 0) {
				alert('지역 선택이 필요합니다.');
				return false;
			}

			$map.attr('data-region', fields.val()).addClass('active');
			$('[data-steps="1"]').removeClass('active').addClass('complete');
			$next.addClass('active');

			$.extend(carSelectData, {
				region:fields.val()
			});

			$(this).layerHide();

			e.preventDefault();
		});

		$('[data-steps="3"]').find('.btn-add-car').on('click', selectOther);

		$('.btn-compare').on('click', function() {
			var $result = $('.box-result');

			if(carSelectData.cars.length < 2) {
				alert('차량 선택이 필요 합니다.'); //TODO: 문구 변경 필요
				return false;
			}
			$result.show();
			$('.box-detail').show();

			$('html, body').animate({
				'scrollTop':$result.offset().top
			}, compare);
		});

		$('.btn-detail').on('click', function() {
			$('.detail-content').slideToggle(function() {
				var $detail = $(this);
				$('html, body').animate({
					'scrollTop':$detail.offset().top
				});
			});
		});
	}

	function selectNiro() {
		var $niro = $(this),
			$next = $('[data-steps="3"]');

		$next.addClass('active');
		$('[data-steps="2"]').removeClass('active').addClass('complete');

		$niro.closest('li').addClass('selected').siblings().removeClass('selected');

		var _data = DATA_BASE.cars.NIRO.models.hybrid.trims[$niro.val()];

		$.each(carSelectData.cars, function(i, v) {
			if(v && v.name == '니로') {
				carSelectData.cars.splice(i, 1);
			}
		});

		carSelectData.cars.unshift({
			car:'niro',
			name:'니로',
			data:_data
		});

		$.extend(carSelectData, {
			cars:carSelectData.cars
		});
	}

	function selectOther() {
		var carsTmp = _.template($('#select-other').html()),
			modelTmp = _.template($('#select-model').html()),
			trimTmp = _.template($('#select-trim').html()),
			selectedCarTmp = _.template($('#selected-car').html()),
			selectModel = null,
			selectCar = null,
			$target = $(this),
			$selectNiro = $('input[name="select-niro"]:checked').val();

		$layerAddCar.addClass('active')
			.find('.btn-layer-close').on('click', function() {
				$(this).closest('.layer').removeClass('active');
				$layerAddCar.off('click', '.btn-confirm');
			});

		$layerAddCar.off('click').on('click', '.btn-confirm', function(e) {
				e.preventDefault();

				if($('input[name="cars"]:checked').length <= 0) {
					alert('차량을 선택해 주세요.');
					return false;
				}
				if($('input[name="model"]:checked').length <= 0) {
					alert('모델명을 선택해 주세요.');
					return false;
				}
				if($('input[name="trim"]:checked').length <= 0) {
					alert('트림을 선택해 주세요.');
					return false;
				}

				carSelectData.cars.push({
					car:selectCar.car,
					name:selectCar.name,
					data:selectCar.data
				});

				$.extend(carSelectData, {
					cars:carSelectData.cars
				});

				$target.closest('.box-car').find('li').eq(carIndex).append(selectedCarTmp(selectCar));

				selectCar = null;
				carIndex++;

				$('.btn-compare').addClass('active');
				$(this).closest('.layer').removeClass('active');
			});

		$formAddCar.html(carsTmp({
			car:DATA_BASE.cars,
			guide:{
				niro:DATA_BASE.cars.NIRO.models.hybrid.trims[$selectNiro].name,
				compete:(function() {
					var text = '';
					switch($selectNiro) {
						case 'luxury':
							text = '니로 ‘럭셔리’ 트림은 <span id="compete-car">‘트랙스 LT’, ‘티볼리 LX’, ‘QM3 LE’</span> 와  비교를 추천 드립니다.';
							break;
						case 'prestige':
							text = '니로 ‘프레스티지’ 트림은 <span id="compete-car">‘트랙스 LTZ’, ‘티볼리 LX’, ‘QM3 RE’</span> 와  비교를 추천 드립니다.';
							break;
						case 'noblesse':
							text = '니로 노블레스 트림은 소형 SUV내 비교 모델이 없습니다.';
							break;
					}
					return text;
				})()
			}
		})).on('click', 'input[name="cars"]', changeCar);

		var guideIndex = 0;
		function guideIn() {
			$(this).delay(400).animate({opacity:1}, guideOut);
		}
		function guideOut() {
			guideIndex++;
			if(guideIndex >= 2) return false;
			$(this).delay(400).animate({opacity:0}, guideIn);
		}
		$('#compete-guide').delay(400).animate({opacity:0}, guideIn);

		function changeCar() {
			selectModel = $(this).val();

			$('#add-model').html(' ').prev('.btn-select').html('모델명 선택');
			$('#add-trim').html(' ').prev('.btn-select').html('트림 선택');

			$('#add-model').html(modelTmp({
				model:DATA_BASE.cars[selectModel].models
			})).closest('.step').on('click', 'input[name="model"]', changeModel);

			if($selectNiro == 'luxury') {
				switch($('input[name="cars"]:checked').val()) {
					case 'TRAX':
						$('#compete-car').html('‘트랙스 LT’');
						break;
					case 'TIVOLI':
						$('#compete-car').html('‘티볼리 LX’');
						break;
					case 'QM3':
						$('#compete-car').html('‘QM3 LE’');
						break;
				}
			} else if($selectNiro == 'prestige') {
				switch($('input[name="cars"]:checked').val()) {
					case 'TRAX':
						$('#compete-car').html('‘트랙스 LTZ’');
						break;
					case 'TIVOLI':
						$('#compete-car').html('‘티볼리 LX’');
						break;
					case 'QM3':
						$('#compete-car').html('‘QM3 RE’');
						break;
				}
			}
		}

		function changeModel() {
			var $trim = $(this).val();

			$('#add-trim').html(' ').prev('.btn-select').html('트림 선택');

			$('#add-trim').html(trimTmp({
				trim:DATA_BASE.cars[selectModel].models[$trim].trims
			})).closest('.step').on('click', 'input[name="trim"]', changeTrim);
		}

		function changeTrim() {
			var $car = $('input[name="cars"]:checked').val()
				$carName = $('input[name="cars"]:checked').data('name'),
				$model = $('input[name="model"]:checked').val(),
				$trim = $('input[name="trim"]:checked').val(),
				_data = DATA_BASE.cars[$car].models[$model].trims[$trim];

			selectCar = {
				car:$car.toLowerCase(),
				name:$carName,
				data:_data,
				setPrice:numberWithCommas
			};
		}
	}

	function compare() {
		var resultTmp = _.template($('#result-car').html()),
			detailTmp = _.template($('#detail-car').html());

		$('.subsidy').hide();

		$('#graph').html(resultTmp({
			buyingRate:DATA_BASE.buyingRate,
			live:DATA_LIVE.body.data,
			data:carSelectData,
			setPrice:numberWithCommas
		})).find('.graph').each(function() {
			$(this).find('span[data-percent]:visible').each(function(i) {
				var $percent = $(this).data('percent');
				$(this).delay(i * 600).animate({
					width:$percent + '%'
				}, function() {
					/*
					if($(this).is('.subsidy')) {
						function _fadeIn() {
							$('.subsidy').delay(800).fadeIn(_fadeOut);
						}
						function _fadeOut() {
							$('.subsidy').delay(800).fadeOut(_fadeIn);
						}
						$(this).fadeIn(_fadeOut);
					}
					*/
				});
			});
		}).find('span').promise().done(function() {
			var $graph = $('.box-graph .niro .graph > span:not(.subsidy)'),
				$subsidy = 1000000;

			$graph.each(function(i) {
				var $index = $graph.length - i - 1,
					$price = $graph.eq($index).data('price'),
					$sellingPrice = $graph.filter('.selling-price').data('price');

				$subsidy = $subsidy - ($price > 0 ? $price : 0);

				if($subsidy > 0) {
					$graph.eq($index).delay(600 * (i + 1)).animate({width:0}, function() {
						$(this).hide();
					});
				}
				if($index == 0) {
					$graph.eq($index).delay(600 * (i + 1)).animate({
						width: (Math.abs($subsidy) / 1000000 * 2.7) - 20 + '%'
					}, function() {
						function _fadeIn() {
							$('.subsidy').delay(800).fadeIn(_fadeOut);
						}
						function _fadeOut() {
							$('.subsidy').delay(800).fadeOut(_fadeIn);
						}
						$('.subsidy').fadeIn(_fadeOut);
					});
				}
			});
		});

		$('#detail').html(detailTmp({
			buyingRate:DATA_BASE.buyingRate,
			live:DATA_LIVE.body.data,
			data:carSelectData,
			setPrice:numberWithCommas
		}));
	}

	$(function() {
		init();

		$('body').on('click', '.btn-select', function() {
			var $btn = $(this);
			$('.btn-select').closest('.step').removeClass('active');

			$btn.closest('.step').addClass('active')
				.find('input[type="radio"]').on('click', function() {
					$btn.html($(this).data('name')).closest('.step').removeClass('active');
				});
		});

		//선택 초기화
		$('.btn-reset').on('click', function() {
			carSelectData = {
				region:null,
				cars:[]
			};
			carIndex = 0;
			$('html, body').scrollTop(0).css({
				zoom:1
			});

			$('[data-steps]').removeClass('complete');
			$('[data-steps="1"]').addClass('active');
			$('.selected-region').removeAttr('data-region');
			$('.competitor .box-car .car').remove();
			$('.box-select .steps li:not(:first-child), .selected-region').removeClass('active');
			$('input[name="select-niro"]').prop('checked', false);
			$('.btn-compare').removeClass('active');
			$('[data-steps="2"] li').removeClass('selected');
			$('.box-result, .box-detail').css({
				display:'none',
				zoom:1
			});
		});
	});
})();
