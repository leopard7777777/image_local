openerp.image_local = function(instance) {
	var _t = instance.web._t;
	var QWeb = openerp.web.qweb;
	var no_image = "/web/static/src/img/placeholder.png";

	instance.web_kanban.KanbanRecord.include({
		kanban_image : function(model, field, id, cache, options) {
			// 获取图片的http route
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
					$img
							.load(function() {
								if (!self.options.size)
									return;
								$img.css("max-width", "" + self.options.size[0]
										+ "px");
								$img.css("max-height", ""
										+ self.options.size[1] + "px");
							});
					$img.on('error', function() {
						$img.attr('src', self.placeholder);
						instance.webclient.notification.warn(_t("Image"),
								_t("Could not display the selected image."));
					});
				},
				on_clear : function() {
					this._super.apply(this, arguments);
					this.internal_set_value('');
					this.render_value();
					this.set_filename('');
				},
				set_value : function(value_) {
					var changed = value_ !== this.get_value();
					this._super.apply(this, arguments);
					if (!changed) {
						this.trigger("change:value", this, {
							oldValue : value_,
							newValue : value_
						});
					}
				},
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
					this.$el.find('.oe_form_binary_url_upload').click(
							this.on_pic_url);

				},
				on_pic_url : function(ev) {
					var self = this;
					// 使用jquery ui dialog
					var $url_dialog = $("<div></div>")
							.html(
									"<form><fieldset><label for='pic_url'>URL：</label><span class='oe_form_field oe_form_field_char'><input type='text' name='pic_url' id='pic_url' style='width:400px' class='text ui-widget-content ui-corner-all'/></span></fieldset></form>")
							.dialog(
									{
										title : "Please Enter Picture URL",
										// 生成dialog是自动打开
										autoOpen : true,
										height : 160,
										width : 500,
										modal : true,
										buttons : {
											"Confirm" : function() {
												var pic_obj = new Image();
												var pic_url = $("#pic_url")
														.val().replace(
																'https://',
																'http://');
												if (!/http:\/\/*/.test(pic_url)) {
													pic_url = 'http://'
															+ pic_url;
												}
												pic_obj.src = pic_url;
												pic_obj.onload = function() {
													self
															.internal_set_value(pic_url);
													self.render_value();
													self
															.do_warn(
																	_t("Remote Picture"),
																	_t("Get remote picture successfully !"));
												}; // 它在图像完全载入到内存之后调用。
												pic_obj.onerror = function() {
													self
															.do_warn(
																	_t("Remote Picture"),
																	_t("There was a problem while get your pic"));
												};// 它在图像载入失败后调用，图像载入失败不会调用onload事件。
												$(this).dialog("close");
												// dialog时用完后必须要移除，不然val不会改变
												$(this).remove();
												return true;
											},
										// "Cancel" : function() {
										// $(this).dialog("close");
										// return false;
										// }
										},
									});
					// $url_dialog.dialog('open');
				},
				/***************************************************************
				 * initialize_content : function() { var self = this; var
				 * dataset = new instance.web.DataSetSearch(this, 'res.users',
				 * {}, []); dataset.read_ids([ instance.session.uid ], [ 'name' ])
				 * .then(function(res) { if (res) self.user_name = res[0].name;
				 * }); this._super(); },
				 **************************************************************/
				// /最后一个参数，file_base64改成 file_name
				on_file_uploaded_and_valid : function(size, name, content_type,
						file_name) {
					if (name) {
						// 这里存入文件名，对应this.get('value')取出
						this.internal_set_value(file_name);
						var show_value = name + " ("
								+ instance.web.human_size(size) + ")";
						this.binary_value = true;
						this.set_filename(name);
						this.render_value();
						this.do_warn(_t("File Upload"),
								_t("File Upload Successfully !"));
					} else {
						this
								.do_warn(
										_t("File Upload"),
										_t("There was a problem while uploading your file"));
					}
				},
			/*******************************************************************
			 * on_save_as : function(ev) { var value = this.get('value'); if
			 * (!value) { this .do_warn( _t("Save As..."), _t("The field is
			 * empty, there's nothing to save !")); ev.stopPropagation(); } else {
			 * instance.web.blockUI(); var c = instance.webclient.crashmanager;
			 * var filename_fieldname = this.node.attrs.filename; var
			 * filename_field = this.view.fields &&
			 * this.view.fields[filename_fieldname]; this.session .get_file({
			 * url : '/web/images/saveas_ajax', data : { data : JSON
			 * .stringify({ model : this.view.dataset.model, id :
			 * (this.view.datarecord.id || ''), field : this.name,
			 * filename_field : (filename_fieldname || ''), data :
			 * instance.web.form .is_bin_size(value) ? null : value, filename :
			 * filename_field ? filename_field .get('value') : null, context :
			 * this.view.dataset .get_context() }) }, complete :
			 * instance.web.unblockUI, error : c.rpc_error.bind(c) });
			 * ev.stopPropagation(); return false; } },
			 ******************************************************************/
			/*******************************************************************
			 * on_list_image : function() { var images_list = this.get('value');
			 * var self = this; if (!this.get('value')) {
			 * this.do_warn(_t("Image"), _t("Image not available !")); return
			 * false; } this.image_list_dialog = new instance.web.Dialog(this, {
			 * title : _t("Image List"), width : '840px', height : '70%',
			 * min_width : '600px', min_height : '500px', buttons : [ { text :
			 * _t("Close"), click : function() { self.image_list_dialog.close(); } } ]
			 * }).open(); this.on_render_dialog(); }, on_render_dialog :
			 * function() { var images_list = JSON.parse(this.get('value')); var
			 * self = this; var url_list = []; if (images_list) {
			 * _.each(images_list, function(index) { if (index) { if
			 * (index['name_1']) { url_list.push({ 'name' : index['name_1'],
			 * 'path' : index['name'] }); } else { url_list.push({ 'name' :
			 * index['orignal_name'], 'path' : index['name'] }); } } }); } else {
			 * return false; } var image_list = []; var start = 0; for (var i =
			 * 1; i <= Math.ceil(url_list.length / 4); i++) {
			 * image_list.push(url_list.slice(start, start + 4)); start = i * 4; }
			 * this.image_list_dialog.$el.html(QWeb.render( 'DialogImageList', {
			 * 'widget' : this, 'image_list' : image_list }));
			 * this.image_list_dialog.$el.find(".oe-remove-image").click(
			 * function() { self.do_remove_image(this, true); }); },
			 * render_value : function() { var self = this;
			 * this.$el.find('.oe-image-preview').click(
			 * this.on_preview_button);
			 * this.$el.find('.oe_image_list').click(this.on_list_image); var
			 * images_list = JSON.parse(this.get('value'));
			 * this.$el.find('#imagedescription').remove(); var $img =
			 * QWeb.render("ImageDescription", { image_list : images_list,
			 * widget : this }); this.$el.append($img); this.$el
			 * .find(".oe_image_row") .click( function() { if (this.id) { var
			 * clicked = this.id; var name_desc = ""; _ .each( images_list,
			 * function(index) { if (index['name'] == clicked) { var title =
			 * index['name_1'] ? index['name_1'] : ''; var description =
			 * index['description'] ? index['description'] : ''; name_desc =
			 * 'Title:-' + title + '<br/>Description:-' + description; } });
			 * self.do_display_image(this, name_desc); } });
			 * this.$el.find(".oe_list_record_delete").click(function() { if
			 * (this.id) { self.do_remove_image(this, false); } }); this.$el
			 * .find(".oe-record-edit-link") .click( function() { var self_1 =
			 * this; var data = JSON .parse(self.get('value')); _ .each( data,
			 * function(d) { if (d.name == self_1.id) { self.name_display =
			 * d.name_1 ? d.name_1 : ''; self.description_display =
			 * d.description ? d.description : ''; } }); self.select_mo_dialog = $(
			 * QWeb .render( 'edit_name_description', { widget : self }))
			 * .dialog( { resizable : false, modal : true, title : _t("Image
			 * Description"), width : 500, buttons : { "Ok" : function() { var
			 * new_list = []; var data = JSON .parse(self .get('value')); if
			 * (self_1.id && data) { _ .each( data, function( index) { if
			 * (index['name'] != self_1.id) { new_list .push(index); } else {
			 * index["name_1"] = self.select_mo_dialog .find( '#name_1') .val();
			 * index["description"] = self.select_mo_dialog .find(
			 * '#description') .val(); new_list .push(index); } }); self
			 * .internal_set_value(JSON .stringify(new_list)); self.invalid =
			 * false; self.dirty = true; self .render_value(); $(this) .dialog(
			 * "close"); } }, "Close" : function() { $(this) .dialog( "close"); } },
			 * }); }); }, do_display_image : function(curr_id, name_desc) {
			 * this.$el.find('.oe-image-preview').lightbox({ fitToScreen : true,
			 * jsonData : [ { "url" : curr_id.id, "title" : name_desc } ],
			 * loopImages : true, imageClickClose : false, disableNavbarLinks :
			 * true }); }, do_remove_image : function(curr_id, dialog) { var
			 * self = this; var images_list = JSON.parse(this.get('value')); if
			 * (images_list) { var new_list = []; if (confirm(_t("Are you sure
			 * to remove this image?"))) { _.each(images_list, function(index) {
			 * if (index['name'] != curr_id.id) { new_list.push(index); } });
			 * self.internal_set_value(JSON.stringify(new_list)); this.invalid =
			 * false; this.dirty = true; if (dialog) { this.on_render_dialog(); }
			 * else { this.render_value(); } } } }, on_preview_button :
			 * function() { var images_list = JSON.parse(this.get('value')); var
			 * url_list = []; var self = this; if (images_list) { _ .each(
			 * images_list, function(index) { if (index) { var title =
			 * index['name_1'] ? index['name_1'] : ''; var description =
			 * index['description'] ? index['description'] : ''; url_list
			 * .push({ "url" : index['name'], "title" : 'Title:-' + title + '<br/>Description:-' +
			 * description }); } }); } else { this.do_warn("Image", "Image not
			 * available !"); return false; }
			 * this.$el.find('.oe-image-preview').lightbox({ fitToScreen : true,
			 * jsonData : url_list, loopImages : true, imageClickClose : false,
			 * disableNavbarLinks : true }); },
			 ******************************************************************/
			});

	instance.web.form.widgets = instance.web.form.widgets.extend({
		'image' : 'instance.web.form.FieldImageFile',
	});
};
