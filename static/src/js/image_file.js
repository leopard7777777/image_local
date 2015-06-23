openerp.image_local = function(instance) {
	var _t = instance.web._t;
	var QWeb = openerp.web.qweb;
	var no_image = "/web/static/src/img/placeholder.png";

	instance.web_kanban.KanbanRecord.include({
		kanban_image : function(model, field, id, cache, options) {
			// 获取图片的http route
			if (field) {
				u = this.record[field].value;
				if (u) {
					if (decodeURIComponent(u).indexOf("http://") != 0) {
						url = this.session.url('/web/images/get', {
							file_name : u
						});
					} else {
						url = decodeURIComponent(u);
					}
				} else {
					url = no_image;
				}
			} else {
				url = no_image;
			}
			return url;
		}
	});

	instance.web.form.FieldImageFile = instance.web.form.FieldBinaryImage
			.extend({
				template : 'FieldImageFile',
				placeholder : no_image,
				render_value : function() {
					// 回显
					var self = this;
					var url;
					var p_val = this.get('value');
					if (p_val
					/***********************************************************
					 * && !instance.web.form .is_bin_size(this.get('value'))
					 **********************************************************/
					) {
						// 此处url解码后，根据是否有http://打头来判断是本地图片还是网络图片
						if (decodeURIComponent(p_val).indexOf("http://") != 0) {
							// 获取图片的http route
							url = this.session.url('/web/images/get', {
								file_name : this.get('value')
							});
						} else {
							url = decodeURIComponent(p_val);
						}
					}/*******************************************************
						 * else if (this.get('value')) { var id = JSON
						 * .stringify(this.view.datarecord.id || null); var
						 * field = this.name; if (this.options.preview_image)
						 * field = this.options.preview_image; url =
						 * this.session.url('/web/images/image', { model :
						 * this.view.dataset.model, id : id, field : field, t :
						 * (new Date().getTime()), }); }
						 ******************************************************/
					else {
						url = this.placeholder;
					}
					// 沿用fieldBinaryImage模版
					var $img = $(QWeb.render("FieldBinaryImage-img", {
						widget : this,
						url : url
					}));
					$($img).click(function(e) {
						if (self.view.get("actual_mode") == "view") {
							var $button = $(".oe_form_button_edit");
							$button.openerpBounce();
							e.stopPropagation();
						}
					});
					this.$el.find('> img').remove();
					this.$el.prepend($img);
					$img.load(function() {
						if (!self.options.size)
							return;
						$img.css("max-width", "" + self.options.size[0] + "px");
						$img.css("max-height", "" + self.options.size[1] + "px");
					});
					$img.on('error', function() {
						$img.attr('src', self.placeholder);
						instance.webclient.notification.warn(_t("Image"), _t("Could not display the selected image."));
					});
				},
				on_clear : function() {
					this._super.apply(this, arguments);
					this.internal_set_value('');
					this.render_value();
					this.set_filename('');
				},
				// set_value : function(value_) {
				// var changed = value_ !== this.get_value();
				// this._super.apply(this, arguments);
				// if (!changed) {
				// this.trigger("change:value", this, {
				// oldValue : value_,
				// newValue : value_
				// });
				// }
				// },
				init : function(field_manager, node) {
					var self = this;
					this._super(field_manager, node);
					this.binary_value = false;
					this.useFileAPI = !window.FileReader;
					this.max_upload_size = 25 * 1024 * 1024; // 25Mo
					if (!this.useFileAPI) {
						this.fileupload_id = _.uniqueId('oe_fileupload');
						$(window).on(this.fileupload_id, function() {
							var args = [].slice.call(arguments).slice(1);
							self.on_file_uploaded.apply(self, args);
						});
					}
				},
				initialize_content : function() {
					this._super.apply(this, arguments);
					// var self= this;
					// this.$el.find('input.oe_form_binary_file').change(this.on_file_change);
					// this.$el.find('button.oe_form_binary_file_save').click(this.on_save_as);
					// this.$el.find('.oe_form_binary_file_clear').click(this.on_clear);
					// this.$el.find('.oe_form_binary_file_edit').click(function(event){
					// self.$el.find('input.oe_form_binary_file').click();
					// });
					// 在template中加入了一个pic url上传的按钮
					this.$el.find('.oe_form_binary_url_upload').click(this.on_pic_url);

				},
				on_pic_url : function(ev) {
					var self = this;
					// 使用jquery ui dialog
					var $url_dialog = $("<div></div>")
							.html(
									"<form><fieldset><label for='pic_url'>URL：</label><span class='oe_form_field oe_form_field_char'><input type='text' name='pic_url' id='pic_url' style='width:400px' class='text ui-widget-content ui-corner-all'/></span></fieldset></form>")
							.dialog({
								title : "Please Enter Picture URL",
								// 生成dialog是自动打开
								autoOpen : true,
								height : 160,
								width : 600,
								modal : true,
								show : {
									effect : "blind",
									duration : 555,
								},
								hide : {
									effect : "explode",
									duration : 555,
								},
								buttons : {
									"Confirm" : function() {
										var pic_obj = new Image();
										var pic_url = $(this).find("#pic_url").val().replace('https://', 'http://');
										if (!/http:\/\/*/.test(pic_url)) {
											pic_url = 'http://' + pic_url;
										}
										pic_obj.src = pic_url;
										pic_obj.onload = function() {
											self.internal_set_value(pic_url);
											self.render_value();
											self.do_warn(_t("Remote Picture"), _t("Get remote picture successfully !"));
										}; // 它在图像完全载入到内存之后调用。
										pic_obj.onerror = function() {
											self.do_warn(_t("Remote Picture"), _t("There was a problem while get your pic"));
										};// 它在图像载入失败后调用，图像载入失败不会调用onload事件。
										$(this).dialog("close");
										return true;
									},
								// "Cancel" : function() {
								// $(this).dialog("close");
								// return false;
								// }
								},
								close : function(ev, ui) {
									// dialog时用完后必须要移除，不然val不会改变
									$(this).remove();
								},
							});
					// $url_dialog.dialog('open');
				},
				// /最后一个参数，file_base64改成 file_name
				on_file_uploaded_and_valid : function(size, name, content_type, file_name) {
					if (name) {
						// 这里存入文件名，对应this.get('value')取出
						this.internal_set_value(file_name);
						var show_value = name + " (" + instance.web.human_size(size) + ")";
						this.binary_value = true;
						this.set_filename(name);
						this.render_value();
						this.do_warn(_t("File Upload"), _t("File Upload Successfully !"));
					} else {
						this.do_warn(_t("File Upload"), _t("There was a problem while uploading your file"));
					}
				},
			});

	instance.web.form.widgets = instance.web.form.widgets.extend({
		'image' : 'instance.web.form.FieldImageFile',
	});
};
