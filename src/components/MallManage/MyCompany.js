import React, {Component} from 'react';
import {
    HashRouter as Router,
} from 'react-router-dom';
import {
    Input,
    Select,
    Button,
    Modal,
    Form,
    Upload,
    Slider,
    Row,
    Col,
    Icon,
    message,
    Tooltip,
} from 'antd';
import reqwest from 'reqwest';
import * as qiniu from 'qiniu-js';
import * as UUID from 'uuid-js';
import '../../config/config';
import AvatarEditor from 'react-avatar-editor'

const {Option} = Select;
const FormItem = Form.Item;
const {TextArea} = Input;
const confirm = Modal.confirm;

//机构信息编辑表单
const ItemEditForm = Form.create()(
    (props) => {
        const {beforeUpload03, editCompany, readlyOnly, onCancel, onCreate, setPhone, form, data, reqwestUploadToken, viewPic02, setViewPic02, data_pic02, effectPic02, picUpload02, avatarEditor02, setAvatarEditor02, logoLoading, provinceList, cityList, districtList, streetList, markers, setMarkers, area, setArea, mapObj, setXY, setFormattedAddress, formattedAddress} = props;
        const {getFieldDecorator} = form;

        // 由图片文件对象获取其base64编码
        const getBase64 = (img, callback) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => callback(reader.result));
            reader.readAsDataURL(img);
        };
        // 由图片地址获取其文件对象
        const dataURLtoFile = (url) => {
            let arr = url.split(','),
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n)
            }
            return new Blob([u8arr], {type: "image/jpeg"});
        };

        // 机构LOGO相关
        const setEditorRef02 = (editor) => this.editor02 = editor;
        const beforeUpload02 = (file) => {
            const isIMG = file.type === 'image/jpeg' || file.type === 'image/png';
            if (!isIMG) {
                message.error('文件类型错误');
                return false
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                message.error('文件不能大于2M');
                return false
            }
            getBase64(file, (imageUrl) => {
                setViewPic02(imageUrl);
            });
            reqwestUploadToken();
            return false
        };
        const uploadButton02 = (
            <div>
                <Icon type={'plus'}/>
                <div className="ant-upload-text" style={{display: viewPic02 ? "none" : "block"}}>选择图片</div>
            </div>
        );
        const picHandle02 = () => {
            if (viewPic02 && viewPic02.slice(26) !== data_pic02) {
                const canvas = this.editor02.getImage();
                const url = canvas.toDataURL("png", 0.92);
                if (url === effectPic02) {
                    message.error("图片未改动，无法提交");
                    return
                }
                const file = dataURLtoFile(url);
                picUpload02(url, file)
            } else {
                message.error("图片未改动，无法提交");
            }
        };
        const partImg02 = (
            <AvatarEditor
                ref={setEditorRef02}
                image={viewPic02}
                width={80}
                height={80}
                border={0}
                color={[255, 255, 255, 0.6]}
                scale={avatarEditor02.scale}
                position={{x: avatarEditor02.positionX, y: avatarEditor02.positionY}}
                rotate={0}
            />
        );

        // 机构地址相关
        const provinceOptions = provinceList.map(item => <Option key={item.name}>{item.name}</Option>);
        const cityOptions = cityList.map(item => <Option key={item.name}>{item.name}</Option>);
        const districtOptions = districtList.map(item => <Option key={item.name}>{item.name}</Option>);
        const streetOptions = streetList.map(item => <Option key={item.name}>{item.name}</Option>);
        const addressChange = (value) => {
            if (!value) {
                return
            }
            let keyword = "";
            keyword = keyword + area.province + area.city + area.district + area.street;
            keyword = keyword + value;
            // 清除已有标记点
            mapObj.remove(markers);
            mapObj.plugin('AMap.Geocoder', function () {
                const geocoder = new window.AMap.Geocoder({});
                const marker = new window.AMap.Marker({
                    map: mapObj,
                    bubble: true
                });
                geocoder.getLocation(keyword, (status_, result_) => {
                    if (status_ === 'complete' && result_.info === 'OK') {
                        geocoder.getAddress([result_.geocodes[0].location.lng, result_.geocodes[0].location.lat], (status, result) => {
                            if (status === 'complete' && result.info === 'OK') {
                                // 经纬度写入
                                setXY({x: result_.geocodes[0].location.lng, y: result_.geocodes[0].location.lat});
                                // 生成当前标记点
                                marker.setPosition(result_.geocodes[0].location);
                                mapObj.setCenter(marker.getPosition());
                                setMarkers(marker);
                                // address字段写入
                                setFormattedAddress(area.street ? keyword : result.regeocode.addressComponent.province + result.regeocode.addressComponent.city + result.regeocode.addressComponent.district + result.regeocode.addressComponent.township + keyword);
                                // 其他地址信息写入
                                setArea(5, result.regeocode.addressComponent);
                            }
                        });
                    }
                });
            });
        };

        return ( 
            <div>
                <header className="clearfix">
                    {/*公司编辑*/}
                    <div className="add-button" style={{float: "right"}}>
                        <Button type="primary" onClick={editCompany} style={{marginRight: 20}}>编辑</Button>
                        {/*<ItemAdd opStatus={this.state.opObj.add} toLoginPage={this.toLoginPage}/>*/}
                    </div>
                </header>
                <div className="institution-add institution-form company-form item-form" style={{width: "90%"}}>
                    <Form layout="vertical">
                        <h4 className="add-form-title-h4">基础信息</h4>
                        <Row gutter={24}>
                            <Col span={8}>
                                <FormItem className="name"  label="公司名称：">
                                    {getFieldDecorator('name', {
                                        initialValue: data.name,
                                        rules: [{
                                            required: true,
                                            message: '公司名称不能为空',
                                        }],
                                    })(
                                        <Input disabled={readlyOnly} placeholder="请输入公司名称"/>
                                    )}
                                </FormItem>
                                <div  style={{position: 'absolute', top: 6, right: 20}}>
                                    <Tooltip title="请填写营业执照上完整的名称">
                                        <span>*填写帮助</span>
                                    </Tooltip>
                                </div>
                            </Col>
                            <Col span={8}>
                                <FormItem className="typeIds" label="公司类型：">
                                    {getFieldDecorator('companyIds', {
                                        // initialValue: 1,
                                        initialValue: data.type,
                                        rules: [{
                                            required: true,
                                            message: '公司类型不能为空',
                                        }],
                                    })(
                                        <Select
                                            style={{width: '100%'}}
                                            disabled={readlyOnly}
                                            placeholder="请选择公司类型"
                                        >
                                            <Option key={2} value={2}>分公司</Option>
                                        </Select>
                                    )}
                                </FormItem>
                            </Col>
                             <Col span={8}>
                                <FormItem className="licenseNumber" label="执照号码：">
                                    {getFieldDecorator('licenseNumber', {
                                        initialValue: data.licenseNumber || "暂无",
                                        rules: [{
                                            required: false,
                                            max: 18,
                                            message: '请填写正确的执照号码',
                                        }],
                                    })(
                                        <Input disabled={readlyOnly} placeholder="请输入18位执照号码"/>
                                    )}
                                </FormItem>                                
                             </Col>
                        </Row>
                        <div className="ant-line"></div>
                        <Row gutter={24}>
                            <Col span={8}>
                                <FormItem className="adminUserName ant-form-explain-reset-css" label="管理员：">
                                    {getFieldDecorator('adminUserName', {
                                        initialValue: data.managerName || "暂无",
                                        rules: [{
                                            required: true,
                                            message: '管理员不能为空',
                                        }],
                                    })(
                                        <Input disabled={readlyOnly} placeholder="请输入机构管理员名字"/>
                                    )}
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem className="adminUserPhone" label="手机号码：">
                                    {getFieldDecorator('adminUserPhone', {
                                        initialValue: data.telephone || "暂无",
                                        rules: [{
                                            required: true,
                                            message: '手机号码不能为空',
                                        }],
                                    })(
                                        <Input disabled={readlyOnly} placeholder="请输入管理员手机号" onBlur={(event) => setPhone(event.target.value)}/>
                                    )}
                                </FormItem>
                            </Col>
                        </Row>
                        <div className="ant-line"></div>

                        <h4 className="add-form-title-h4">机构详情</h4>
                        <Row gutter={24}>
                            <Col span={7}>
                                <FormItem className="icon" label="机构LOGO：">
                                    {getFieldDecorator('icon', {
                                        initialValue: data.icon || "暂无",
                                        rules: [{
                                            required: true,
                                            message: '请上传机构LOGO',
                                        }],
                                    })(
                                        <div className="itemBox">
                                            <Upload
                                                name="file"
                                                disabled={readlyOnly}
                                                listType="picture-card"
                                                className="avatar-uploader"
                                                showUploadList={false}
                                                beforeUpload={beforeUpload02}
                                            >
                                                {viewPic02 ? partImg02 : uploadButton02}
                                            </Upload>
                                            <Row>
                                                <Col span={4}>缩放：</Col>
                                                <Col span={12}>
                                                    <Slider min={0.5} max={1.5} step={0.01} value={avatarEditor02.scale}
                                                            disabled={!viewPic02}
                                                            onChange={(value) => {
                                                                setAvatarEditor02(1, value)
                                                            }}/>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col span={4}>X：</Col>
                                                <Col span={12}>
                                                    <Slider min={0} max={1} step={0.01} value={avatarEditor02.positionX}
                                                            disabled={!viewPic02}
                                                            onChange={(value) => {
                                                                setAvatarEditor02(2, value)
                                                            }}/>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col span={4}>Y：</Col>
                                                <Col span={12}>
                                                    <Slider min={0} max={1} step={0.01} value={avatarEditor02.positionY}
                                                            disabled={!viewPic02}
                                                            onChange={(value) => {
                                                                setAvatarEditor02(3, value)
                                                            }}/>
                                                </Col>
                                            </Row>
                                            <Button type="primary"
                                                    disabled={readlyOnly}
                                                    onClick={picHandle02}
                                                    loading={logoLoading}
                                                    style={{
                                                        position: "absolute",
                                                        right: "0",
                                                        bottom: "0"
                                                    }}>{data_pic02 ? "重新提交" : "图片提交"}</Button>
                                        </div>
                                    )}
                                </FormItem>
                            </Col>
                            <Col span={14}>
                                <Row>
                                    <Col span={24}>
                                        <FormItem className="area longItem" label="机构地址：">
                                            {getFieldDecorator('area', {
                                                // initialValue: data.icon || "暂无",
                                                rules: [{
                                                    required: false
                                                }],
                                            })(
                                                <div>
                                                    <Select disabled={readlyOnly} placeholder="省" style={{width: "20%", marginRight: 10}}
                                                            value={area.province || undefined} onChange={(value) => {
                                                        setArea(1, value)
                                                    }} dropdownMatchSelectWidth={false} allowClear={true}>
                                                        {provinceOptions}
                                                    </Select>
                                                    <Select disabled={readlyOnly} placeholder="市" style={{width: "20%", marginRight: 10}}
                                                            value={area.city || undefined} onChange={(value) => {
                                                        setArea(2, value)
                                                    }} dropdownMatchSelectWidth={false} allowClear={true}>
                                                        {cityOptions}
                                                    </Select>
                                                    <Select disabled={readlyOnly} placeholder="区" style={{width: "20%", marginRight: 10}}
                                                            value={area.district || undefined} onChange={(value) => {
                                                        setArea(3, value)
                                                    }} dropdownMatchSelectWidth={false} allowClear={true}>
                                                        {districtOptions}
                                                    </Select>
                                                    <Select disabled={readlyOnly} placeholder="街道" style={{width: "20%"}} value={area.street || undefined}
                                                            onChange={(value) => {
                                                                setArea(4, value)
                                                            }} dropdownMatchSelectWidth={false} allowClear={true}>
                                                        {streetOptions}
                                                    </Select>
                                                </div>
                                            )}
                                        </FormItem>
                                    </Col>
                                </Row>
                                <div className="ant-line"></div>
                                <Row gutter={16}>
                                    <Col span={10}>
                                        <FormItem className="detailedAddress" label="详细地址">
                                            {getFieldDecorator('detailedAddress', {
                                                initialValue: data.detailedAddress || "暂无",
                                                rules: [{
                                                    required: true,
                                                    message: '详细地址不能为空',
                                                }],
                                            })(
                                                <Input disabled={readlyOnly} placeholder="如道路、门牌号、小区、楼栋号、单元室等"
                                                       onBlur={(event) => addressChange(event.target.value)}/>
                                            )}
                                        </FormItem>
                                    </Col>
                                    <Col span={12}>
                                        <FormItem className="managerPhone" label="电话">
                                            {getFieldDecorator('managerPhone', {
                                                initialValue: data.managerPhone || "暂无",
                                                rules: [{
                                                    required: false,
                                                    message: '电话不能为空',
                                                }],
                                            })(
                                                <Input disabled={readlyOnly} placeholder="请输入电话"
                                                       onBlur={(event) => addressChange(event.target.value)}/>
                                            )}
                                        </FormItem>
                                    </Col>
                                </Row>
                                <div className="ant-line"></div>
                                <Row>
                                    <Col>
                                        <p className="addressSaved">定位点：{formattedAddress || "暂无"}</p>
                                        <div id="add-institution-container" name="container" tabIndex="0"/>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        
                        <FormItem className="description longItem" label="公司简介：">
                            {getFieldDecorator('description', {
                                initialValue: data.description || "暂无",
                                rules: [{
                                    required: true,
                                    message: '公司简介不能为空',
                                }],
                            })(
                                <TextArea disabled={readlyOnly} style={{resize: "none"}} placeholder="请填写机构简介" rows={10}/>
                            )}
                        </FormItem>
                        <div className="ant-line"></div>
                        <h4 className="add-form-title-h4">其它信息</h4>
                        <FormItem className="contract" label="合同附件">
                            {getFieldDecorator('contract', {
                                rules: [{
                                    required: false,
                                    message: '请选择文件',
                                }],
                            })(
                                <div>
                                    {/*<Upload
                                        name="file"
                                        disabled={readlyOnly}
                                        listType="picture-card"
                                        className="avatar-uploader"
                                        showUploadList={false}
                                        action="/file/upload"
                                        beforeUpload={beforeUpload02}
                                    >
                                        {viewPic02 ? partImg02 : uploadButton02}
                                    </Upload>*/}
                                    <Upload
                                        name="file"
                                        disabled={readlyOnly}
                                        // showUploadList={false}
                                        // action="/file/upload"
                                        beforeUpload={beforeUpload03}
                                        >
                                        <Button disabled={readlyOnly}>
                                            <Icon type="upload" /> 选择文件
                                        </Button>
                                    </Upload>                                    
                                </div>
                            )}
                        </FormItem>
                        <Row gutter={24}>
                            <Col span={21}>
                                <FormItem className="additionalProtocol unnecessary"
                                          label="附加协议：">
                                    {getFieldDecorator("additionalProtocol", {
                                        initialValue: data.additionalProtocol || "暂无",
                                        rules: [{
                                            required: false
                                        }],
                                    })(
                                        <TextArea disabled={readlyOnly} style={{resize: "none"}} placeholder="请填写附加协议" rows={10}/>
                                    )}
                                </FormItem>
                            </Col>
                        </Row>
                    </Form>
                </div>
                <footer className="clearfix" style={{height: 100, marginTop: 20, display: readlyOnly ? "none" : "block"}}>
                    {/*公司编辑*/}
                    <div className="add-button" style={{float: "right"}}>
                        <Button type="primary" onClick={onCreate} style={{marginRight: 20}}>确定</Button>
                        <Button type="primary" onClick={onCancel} style={{marginRight: 20}}>重置</Button>                                                
                    </div>
                </footer>
            </div>           
           
        );
    }
);

//公司信息编辑组件
class ItemEdit extends Component {
    state = {
        visible: false,
        // 控制不能修改
        readlyOnly: true,
        // 机构基本信息
        data: {},
        // 机构类型表
        typeList: [],
        // 短信验证码相关变量
        phone: "",
        countDown: 0,
        codeButtonStatus: false,
        // 机构图片相关变量
        // 获取图片上传Token
        uploadToken: "",
        viewPic01: "",
        photoList01: [],
        avatarEditor01: {
            scale: 1,
            positionX: 0.5,
            positionY: 0.5
        },
        photoLoading: false,
        // 合同文件
        fileList: [],
        // 机构LOGO相关变量
        viewPic02: "",
        data_pic02: "",
        effectPic02: "",
        avatarEditor02: {
            scale: 1,
            positionX: 0.5,
            positionY: 0.5
        },
        logoLoading: false,
        // 机构地址相关变量
        provinceList: [],
        cityList: [],
        districtList: [],
        streetList: [],
        markers: [],
        area: {
            province: "",
            
            city: "",
           
            district: "",
            street: ""
        },
        mapObj: {},
        formattedAddress: "",
        xy: {},        
        provinceId: null,
        cityId: null,
        areaId: null,
        addressLoading: true,
        // 提交按钮状态变量
        confirmLoading: false
    };

    // 短信验证码相关函数
    // 手机号码写入
    setPhone = (para) => {
        this.setState({
            phone: para
        })
    };

    // 短信验证码倒计时函数
    countDown = () => {
        if (this.state.countDown <= 0) {
            clearInterval(this.fn_countDown);
            this.setState({
                countDown: 0,
                codeButtonStatus: false
            });
            return;
        }
        this.setState({
            countDown: this.state.countDown - 1
        })
    };

    // 获取验证码
    getCode = () => {
        if (this.state.codeButtonStatus) {
            // 倒计时未结束，直接return
            return;
        } else {
            const regPhone = /^1[0-9]{10}$/;
            if (regPhone.test(this.state.phone)) {
                reqwest({
                    url: '/mobileCode/sendVerificationCode',
                    type: 'json',
                    method: 'post',
                    data: {
                        phone: this.state.phone
                    },
                    headers: {
                        Authorization: sessionStorage.token
                    },
                    error: (XMLHttpRequest) => {
                        message.error("发送失败");
                    },
                    success: (json) => {
                        if (json.result === 0) {
                            this.setState({
                                codeButtonStatus: true,
                                countDown: 60
                            }, () => {
                                this.fn_countDown = setInterval(this.countDown, 1000)
                            })
                        } else {
                            if (json.code === 901) {
                                message.error("请先登录");
                                // 返回登陆页
                                this.props.toLoginPage();
                            } else if (json.code === 902) {
                                message.error("登录信息已过期，请重新登录");
                                // 返回登陆页
                                this.props.toLoginPage();
                            } else {
                                message.error(json.message);
                                this.setState({
                                    loading: false
                                })
                            }
                        }
                    }
                });
            } else {
                if (this.state.phone) {
                    message.warning("请填写正确的手机号码")
                } else {
                    message.warning("手机号码不能为空")
                }
            }
        }
    };

    // 获取机构类型列表
    getInstitutionTypeList = () => {
        reqwest({
            url: '/sys/orgType/list',
            type: 'json',
            method: 'get',
            headers: {
                Authorization: sessionStorage.token
            },
            error: (XMLHttpRequest) => {
                // const json = {
                //     result: 0,
                //     data: [
                //         {id: 1, name: "01"},
                //         {id: 2, name: "02"},
                //         {id: 3, name: "03"},
                //         {id: 4, name: "04"},
                //     ]
                // };
            },
            success: (json) => {
                if (json.result === 0) {
                    const data = [];
                    json.data.forEach((item) => {
                        let subData = [];
                        if (item.list) {
                            item.list.forEach((subItem) => {
                                subData.push({
                                    key: subItem.id,
                                    value: String(subItem.id),
                                    label: subItem.name
                                })
                            })
                        }                        
                        data.push({
                            key: item.id,
                            value: String(item.id),
                            label: item.name,
                            children: subData
                        })
                    });
                    this.setState({
                        typeList: data
                    });
                } else {
                    if (json.code === 901) {
                        message.error("请先登录");
                        // 返回登陆页
                        this.props.toLoginPage();
                    } else if (json.code === 902) {
                        message.error("登录信息已过期，请重新登录");
                        // 返回登陆页
                        this.props.toLoginPage();
                    } else {
                        message.error(json.message);
                    }
                }
            }
        })
    };

    // 获取机构基本信息
    getData = () => {
        reqwest({
            url: '/admin/org/getDetails',
            type: 'json',
            method: 'get',
            data: {
                // id: this.props.id,
                id: sessionStorage.orgId,
                // id: 10840
            },
            headers: {
                Authorization: sessionStorage.token
            },
            error: (XMLHttpRequest) => {
                // const json = {
                //     result: 0,
                //     data: {
                //         institution: {
                //             address: "浙江省杭州市余杭区仓前街道余杭四无粮仓陈列馆",
                //             areaId: 330110,
                //             areaName: "余杭区",
                //             balance: "",
                //             cityId: 330100,
                //             cityName: "杭州市",
                //             companyName: "",
                //             createTime: "",
                //             // description: "\n" + "\n" + "",
                //             detailedAddress: "余杭四无粮仓陈列馆",
                //             id: 1,
                //             lat: "30.291940",
                //             licenseNumber: "",
                //             lng: "120.007284",
                //             managerName: "",
                //             managerPhone: "",
                //             name: "",
                //             number: null,
                //             photo: "1",
                //             photo2: "",
                //             photo3: "",
                //             photo4: "",
                //             photo5: "",
                //             icon: "",
                //             fees: "",
                //             provinceId: 330000,
                //             provinceName: "浙江省",
                //             star: null,
                //             status: null,
                //             street: "仓前街道",
                //             telephone: "",
                //             typeId: 2,
                //             typeName: "",
                //             typeIdTwo: 3,
                //             updateTime: ""
                //         }
                //     }
                // };
            },
            success: (json) => {
                if (json.result === 0) {
                    // 备注信息写入
                    // json.data.institution.remark = json.data.remark;
                    this.setState({
                        data: json.data.org,
                        // photoList01: photoList01,
                        photoList01: json.data.orgResourceList,
                        viewPic02: json.data.orgResourceList[0] ?  json.data.orgResourceList[0].path : "",
                        effectPic02: json.data.orgResourceList[1] ? json.data.orgResourceList[1].path : "",
                        data_pic02: json.data.orgResourceList[2] ? json.data.orgResourceList[2].path : "",
                        areaId: json.data.org.areaId,
                        formattedAddress: json.data.org.address,
                        xy: {
                            x: json.data.org.lng,
                            y: json.data.org.lat
                        }
                    }, () => {
                        // 机构地址相关操作
                        const mapId = "edit-institution-container" + this.props.id;
                        this.setState({
                            mapObj: new window.AMap.Map(mapId, {
                                resizeEnable: true,
                                zoom: 16,
                                center: this.state.data.lng ? [this.state.data.lng, this.state.data.lat] : ""
                            })
                        }, () => {
                            this.state.mapObj.on('complete', () => {
                                // 获取省份列表
                                this.getProvinceList();
                                // 生成当前标记点
                                const marker = new window.AMap.Marker({
                                    map: this.state.mapObj,
                                    bubble: true
                                });
                                marker.setPosition(this.state.mapObj.G.center);
                                this.state.mapObj.setCenter(marker.getPosition());
                                this.state.markers.push(marker);
                                // 地图点击事件
                                window.AMap.service('AMap.Geocoder', () => {
                                    const geocoder = new window.AMap.Geocoder({extensions: "all"});
                                    this.state.mapObj.on('click', (e) => {
                                        // 清除已有标记点
                                        this.state.mapObj.remove(this.state.markers);
                                        // 经纬度写入
                                        this.setXY({x: e.lnglat.lng, y: e.lnglat.lat});
                                        // 生成当前标记点
                                        const marker = new window.AMap.Marker({
                                            map: this.state.mapObj,
                                            bubble: true
                                        });
                                        marker.setPosition(e.lnglat);
                                        this.state.mapObj.setCenter(marker.getPosition());
                                        this.state.markers.push(marker);
                                        geocoder.getAddress([e.lnglat.lng, e.lnglat.lat], (status, result) => {
                                            if (status === 'complete' && result.info === 'OK') {
                                                this.setFormattedAddress(result.regeocode.formattedAddress);
                                                // 其他地址信息写入
                                                this.setArea(5, result.regeocode.addressComponent);
                                            }
                                        });
                                    });
                                })
                            });
                        })
                    })
                } else {
                    if (json.code === 901) {
                        message.error("请先登录");
                        // 返回登陆页
                        this.props.toLoginPage();
                    } else if (json.code === 902) {
                        message.error("登录信息已过期，请重新登录");
                        // 返回登陆页
                        this.props.toLoginPage();
                    } else {
                        message.error(json.message);
                    }
                }
            }
        })
    };

    showModal = () => {
        // 获取机构基本信息
        this.getData();
        // 获取机构类型列表
        this.getInstitutionTypeList();
        // 获取上传Token
        // this.reqwestUploadToken();
        this.setState({
            visible: true,
        })
    };

    // 点击编辑
    editCompany = () => {
        this.setState({
            readlyOnly: false,
        })
    };

    //图片处理
    getBase64Image01 = (url, width, height) => {//width、height调用时传入具体像素值，控制大小 ,不传则默认图像大小
        const image = new Image();
        image.crossOrigin = '';
        image.src = url;
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width ? width : image.width;
            canvas.height = height ? height : image.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL("image/jpeg", 0.92);
            this.setState({
                viewPic01: dataURL,
                effectPic01: dataURL,
            })
        };
    };
    setViewPic01 = (para) => {
        this.setState({
            viewPic01: para
        })
    };
    setAvatarEditor01 = (index, value) => {
        if (this.state.viewPic01.slice(26) === this.state.data_pic01) {
            this.getBase64Image01(this.state.viewPic01)
        }
        if (index === 1) {
            this.setState({
                avatarEditor01: {
                    scale: value,
                    positionX: this.state.avatarEditor01.positionX,
                    positionY: this.state.avatarEditor01.positionY
                }
            })
        }
        if (index === 2) {
            this.setState({
                avatarEditor01: {
                    scale: this.state.avatarEditor01.scale,
                    positionX: value,
                    positionY: this.state.avatarEditor01.positionY
                }
            })
        }
        if (index === 3) {
            this.setState({
                avatarEditor01: {
                    scale: this.state.avatarEditor01.scale,
                    positionX: this.state.avatarEditor01.positionX,
                    positionY: value
                }
            })
        }
    };

    // 请求上传凭证，需要后端提供接口
    reqwestUploadToken = (file) => {
        reqwest({
            url: '/sys/upload/getToken',
            type: 'json',
            method: 'get',
            headers: {
                Authorization: sessionStorage.token
            },
            error: (XMLHttpRequest) => {
                message.error("发送失败");
            },
            success: (json) => {
                if (json.result === 0) {
                    sessionStorage.uploadToken = json.data;
                    this.setState({
                        uploadToken: json.data,
                    })
                } else {
                    if (json.code === 901) {
                        message.error("请先登录");
                        // 返回登陆页
                        this.props.toLoginPage();
                    } else if (json.code === 902) {
                        message.error("登录信息已过期，请重新登录");
                        // 返回登陆页
                        this.props.toLoginPage();
                    } else {
                        message.error(json.message);
                        this.setState({
                            loading: false
                        })
                    }
                }
            }
        });
    };

    beforeUpload03 = (file) => {
        console.log(file);
        this.reqwestUploadToken();
        this.picUploadFile(file);
        return false
    };

    // 文件上传
    picUploadFile = (file01) => {
        const _this = this;
        this.setState({
             logoLoading: true,
        });
        // const file = para02;
        // const file = sessionStorage.file
        const file = file01;
        console.log(file)
        const key = UUID.create().toString().replace(/-/g,"");
        const token = this.state.uploadToken;
        const config = {
            region: qiniu.region.z0
        };
        const observer = {
            next (res) {
                console.log(res)
            },
            error (err) {
                console.log(err)
                message.error(err.message ? err.message : "文件提交失败");
                _this.setState({
                    logoLoading: false,
                })
            }, 
            complete (res) {
                message.success("文件提交成功");
                let fileList = [];
                fileList.push(res.key);
                console.log(fileList);
                _this.setState({
                    // effectPic02: para01,
                    // data_file: global.config.photoUrl + res.key,
                    fileList: fileList,
                    data_file_copy: res.key,
                    logoLoading: false,
                })
            }
        }
        const observable = qiniu.upload(file, key, token, config)
        observable.subscribe(observer) // 上传开始
    };
    // 图片上传
    picUpload01 = (para) => {
        const _this = this;
        if (this.state.photoList01.length >= 5) {
            message.error("图片最多上传5张");
            return
        } else {
            this.setState({
                photoLoading: true,
            });
            const file = para;
            const key = UUID.create().toString().replace(/-/g,"");
            const token = this.state.uploadToken;
            const config = {
                region: qiniu.region.z0
            };
            const observer = {
                next (res) {
                    console.log(res)
                },
                error (err) {
                    console.log(err)
                    message.error(err.message ? err.message : "图片提交失败");
                    // message.error("图片提交失败");
                    _this.setState({
                        photoLoading: false,
                    })
                }, 
                complete (res) {
                    console.log(res);
                    message.success("图片提交成功");
                    let photoList01 = _this.state.photoList01;                    
                    photoList01.push({
                        path: global.config.photoUrl + res.key
                    });
                    _this.setState({
                        photoList01: photoList01,
                        viewPic01: "",
                        avatarEditor01: {
                            scale: 1,
                            positionX: 0.5,
                            positionY: 0.5
                        },
                        photoLoading: false,
                    })
                }
            }
            const observable = qiniu.upload(file, key, token, config);
            observable.subscribe(observer); // 上传开始
        } 
    };
    //图片删除
    setPhotoList01 = (index) => {
        let data = this.state.photoList01;
        data.splice(index, 1);
        this.setState({
            photoList01: data
        })
    };

    //LOGO处理
    getBase64Image02 = (url, width, height) => {//width、height调用时传入具体像素值，控制大小 ,不传则默认图像大小
        const image = new Image();
        image.crossOrigin = '';
        image.src = url;
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width ? width : image.width;
            canvas.height = height ? height : image.height;
            const ctx = canvas.getContext("2d");
            // ctx.fillStyle = "#fff";
            // ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            // const dataURL = canvas.toDataURL("image/jpeg", 0.92);
            const dataURL = canvas.toDataURL("png", 0.92);
            this.setState({
                viewPic02: dataURL,
                effectPic02: dataURL,
            })
        };
    };
    setViewPic02 = (para) => {
        this.setState({
            viewPic02: para
        })
    };
    setAvatarEditor02 = (index, value) => {
        if (this.state.viewPic02.slice(26) === this.state.data_pic02) {
            this.getBase64Image02(this.state.viewPic02)
        }
        if (index === 1) {
            this.setState({
                avatarEditor02: {
                    scale: value,
                    positionX: this.state.avatarEditor02.positionX,
                    positionY: this.state.avatarEditor02.positionY
                }
            })
        }
        if (index === 2) {
            this.setState({
                avatarEditor02: {
                    scale: this.state.avatarEditor02.scale,
                    positionX: value,
                    positionY: this.state.avatarEditor02.positionY
                }
            })
        }
        if (index === 3) {
            this.setState({
                avatarEditor02: {
                    scale: this.state.avatarEditor02.scale,
                    positionX: this.state.avatarEditor02.positionX,
                    positionY: value
                }
            })
        }
    };
    picUpload02 = (para01, para02) => {
        const _this = this;
        this.setState({
             logoLoading: true,
        });
        const file = para02;
        const key = UUID.create().toString().replace(/-/g,"");
        const token = this.state.uploadToken;
        const config = {
            region: qiniu.region.z0
        };
        const observer = {
            next (res) {
                console.log(res);
            },
            error (err) {
                console.log(err);
                message.error(err.message ? err.message : "图片提交失败");
                _this.setState({
                    logoLoading: false,
                })
            }, 
            complete (res) {
                message.success("图片提交成功");
                _this.setState({
                    effectPic02: para01,
                    data_pic02: global.config.photoUrl + res.key,
                    logoLoading: false,
                })
            }
        }
        const observable = qiniu.upload(file, key, token, config)
        observable.subscribe(observer) // 上传开始
    };

    // 机构地址处理-----------------------------------
    setArea = (type, value) => {
        // 省份信息变更
        if (type === 1) {
            const fnFilter = (item) => {
                return item.name === value
            };
            this.setState({
                area: {
                    province: value,
                    city: "",
                    district: "",
                    street: ""
                }
            }, () => {
                this.setState({
                    cityList: this.state.provinceList.filter(fnFilter)[0] ? this.state.provinceList.filter(fnFilter)[0].districtList : [],
                    provinceId: this.state.provinceList.filter(fnFilter)[0] ? this.state.provinceList.filter(fnFilter)[0].adcode : null,
                    districtList: [],
                    streetList: []
                })
            })
        }
        // 城市信息变更
        if (type === 2) {
            const fnFilter = (item) => {
                return item.name === value
            };
            this.setState({
                area: {
                    province: this.state.area.province,
                    city: value,
                    district: "",
                    street: ""
                },
            }, () => {
                this.setState({
                    districtList: this.state.cityList.filter(fnFilter)[0] ? this.state.cityList.filter(fnFilter)[0].districtList : [],
                    cityId: this.state.cityList.filter(fnFilter)[0] ? this.state.cityList.filter(fnFilter)[0].adcode : null,
                    streetList: []
                })
            })
        }
        // 区信息变更
        if (type === 3) {
            const fnFilter = (item) => {
                return item.name === value
            };
            this.setState({
                area: {
                    province: this.state.area.province,
                    city: this.state.area.city,
                    district: value,
                    street: ""
                },
            }, () => {
                this.setState({
                    streetList: [],
                    areaId: this.state.districtList.filter(fnFilter)[0] ? this.state.districtList.filter(fnFilter)[0].adcode : null
                }, () => {
                    if (this.state.areaId) {
                        this.getStreetList();
                    }
                })
            })
        }
        // 街道信息变更
        if (type === 4) {
            this.setState({
                area: {
                    province: this.state.area.province,
                    city: this.state.area.city,
                    district: this.state.area.district,
                    street: value
                },
            })
        }
        // 地址信息整体写入
        if (type === 5) {
            // 获取城市列表
            const provinceFilter = (item) => {
                return item.name === value.province;
            };
            this.setState({
                cityList: this.state.provinceList.filter(provinceFilter)[0] ? this.state.provinceList.filter(provinceFilter)[0].districtList : [],
            }, () => {
                // 获取地区列表
                // 城市列表只有一条信息，如直辖市，导致value.city为空，则取城市列表第一条作为有效信息
                if (this.state.cityList.length === 1) {
                    value.city = this.state.cityList[0].name;
                }
                const cityFilter = (item) => {
                    return item.name === value.city;
                };
                this.setState({
                    districtList: this.state.cityList.filter(cityFilter)[0] ? this.state.cityList.filter(cityFilter)[0].districtList : [],
                }, () => {
                    // 根据区ID获取街道列表
                    this.state.mapObj.plugin('AMap.DistrictSearch', () => {
                        let districtSearch = new window.AMap.DistrictSearch({
                            level: 'district',
                            subdistrict: 1
                        });
                        districtSearch.search(String(value.adcode), (status, result) => {
                            this.setState({
                                streetList: result.districtList ? result.districtList[0].districtList : [],
                            }, () => {
                                // 地址信息获取完全之后进行写入
                                this.setState({
                                    areaId: value.adcode,
                                    area: {
                                        province: value.province,
                                        city: value.city,
                                        district: value.district,
                                        street: value.township
                                    },
                                    addressLoading: false
                                })
                            })
                        })
                    })
                })
            });
        }
    };
    // 获取省列表（包含市区信息）
    getProvinceList = () => {
        this.state.mapObj.plugin('AMap.DistrictSearch', () => {
            const districtSearch = new window.AMap.DistrictSearch({
                level: 'country',
                subdistrict: 3
            });
            districtSearch.search('中国', (status, result) => {
                this.setState({
                    provinceList: result.districtList[0].districtList
                }, () => {
                    const addressComponent = {
                        province: this.state.data.provinceName,
                        city: this.state.data.cityName,
                        district: this.state.data.areaName,
                        township: this.state.data.street,
                        adcode: this.state.data.areaId
                    };
                    this.setArea(5, addressComponent)
                })
            })
            console.log(this.state.provinceList);
        })
    };
    // 根据区Id获取街道列表
    getStreetList = () => {
        this.state.mapObj.plugin('AMap.DistrictSearch', () => {
            let districtSearch = new window.AMap.DistrictSearch({
                level: 'district',
                subdistrict: 1
            });
            districtSearch.search(this.state.areaId, (status, result) => {
                this.setState({
                    streetList: result.districtList[0].districtList || [],
                })
            })
        })
    };
    // 经纬度写入
    setXY = (para) => {
        this.setState({
            xy: para
        })
    };
    // 定位地址写入
    setFormattedAddress = (para) => {
        this.setState({
            formattedAddress: para
        })
    };
    // 地图标记点信息记录
    setMarkers = (marker) => {
        const arr = [];
        arr.push(marker);
        this.setState({
            markers: arr
        })
    };

    // 信息比对函数
    dataContrast = (values) => {
        const initValues = this.state.data;
        const itemList = ["name", "typeId", "typeIdTwo", "typeIdThree", "telephone", "photo", "photo2", "photo3", "photo4", "photo5", "icon", "fees", "description", "provinceName", "cityName", "areaName", "areaId", "street", "address", "detailedAddress", "lng", "lat", "companyName", "licenseNumber", "additionalProtocol", "geschaftszeit", "scope", "classNumber", "teacherNumber", "label"];
        const result = {};
        itemList.forEach((item) => {
            if (values[item] !== initValues[item]) {
                result[item] = values[item];
            }
        });
        console.log(result);
        if (JSON.stringify(result) === "{}") {
            return false;
        } else {
            result.educationKey = this.props.educationKey;
            return result;
        }
    };

    // 取消操作
    handleCancel = () => {
        const form = this.form;
        const cancel = () => {
            // this.setState({
            //     visible: false
            // }, () => {
                this.setState({
                    data: {},
                    typeList: [],
                    viewPic01: "",
                    photoList01: [],
                    avatarEditor01: {
                        scale: 1,
                        positionX: 0.5,
                        positionY: 0.5
                    },
                    photoLoading: false,
                    viewPic02: "",
                    data_pic02: "",
                    effectPic02: "",
                    avatarEditor02: {
                        scale: 1,
                        positionX: 0.5,
                        positionY: 0.5
                    },
                    logoLoading: false,
                    provinceList: [],
                    cityList: [],
                    districtList: [],
                    streetList: [],
                    markers: [],
                    area: {
                        province: "",
                        city: "",
                        district: "",
                        street: ""
                    },
                    mapObj: {},
                    formattedAddress: "",
                    xy: {},
                    areaId: null,
                    addressLoading: true,
                    confirmLoading: false
                });
            // })
        };
        // data空值处理
        if (JSON.stringify(this.state.data) === "{}") {
            cancel();
            return;
        }
        // 地址信息加载中处理
        if (this.state.addressLoading) {
            message.warning("地图信息加载中，请稍后进行操作");
            return
        }
        form.validateFields((err, values) => {
            values.typeId = values.typeIds ? values.typeIds[0] : 0;
            values.typeIdTwo = values.typeIds ? (values.typeIds[1] || 0) : 0;
            values.typeIdThree = values.typeIds ? (values.typeIds[2] || 0) : 0;
            values.photo = this.state.photoList01[0];
            values.photo2 = this.state.photoList01[1] || 0;
            values.photo3 = this.state.photoList01[2] || 0;
            values.photo4 = this.state.photoList01[3] || 0;
            values.photo5 = this.state.photoList01[4] || 0;
            values.icon = this.state.data_pic02;
            values.provinceName = this.state.area.province;
            values.cityName = this.state.area.city;
            values.areaName = this.state.area.district;
            values.areaId = this.state.areaId;
            values.street = this.state.area.street;
            values.address = this.state.formattedAddress;
            values.lng = this.state.xy.x;
            values.lat = this.state.xy.y;
            const result = this.dataContrast(values);
            if (result) {
                confirm({
                    title: '已修改信息未保存，确认放弃修改？',
                    content: "",
                    okText: '确认',
                    okType: 'danger',
                    cancelText: '取消',
                    onOk() {
                        cancel();
                    }
                });
            } else {
                cancel()
            }
        })
    };

    // 确认操作
    handleCreate = () => {
        // data空值处理
        if (JSON.stringify(this.state.data) === "{}") {
            return;
        }
        // 地址信息加载中处理
        if (this.state.addressLoading) {
            message.warning("地图信息加载中，请稍后进行操作");
            return
        }
        const form = this.form;
        form.validateFieldsAndScroll((err, values) => {
            if (err) {
                return;
            }
            // 机构类型写入与校验
            // if (values.typeIds.length > 3) {
            //     message.error("机构类型最多选三项");
            //     return;
            // }
            // values.typeId = values.typeIds ? values.typeIds[0] : 0;
            // values.typeIdTwo = values.typeIds ? (values.typeIds[1] || 0) : 0;
            // values.typeIdThree = values.typeIds ? (values.typeIds[2] || 0) : 0;
            // 机构图片写入与校验
            // values.photo = this.state.photoList01;
            // values.photo2 = this.state.photoList01[1] || 0;
            // values.photo3 = this.state.photoList01[2] || 0;
            // values.photo4 = this.state.photoList01[3] || 0;
            // values.photo5 = this.state.photoList01[4] || 0;
            // if (!values.photo) {
            //     message.error("课程图片未选择或未提交");
            //     return
            // }

            // 机构logo写入
            // values.icon = this.state.data_pic02;
            if (this.state.data_pic02) {
                values.icon = this.state.data_pic22
            }
            // 机构地址信息写入
            values.provinceName = this.state.area.province;
            values.provinceId = this.state.provinceId;
            values.cityName = this.state.area.city;
            values.cityId = this.state.cityId;
            values.areaName = this.state.area.district;
            values.areaId = this.state.areaId;
            values.street = this.state.area.street;
            values.address = this.state.formattedAddress;
            values.lng = this.state.xy.x;
            values.lat = this.state.xy.y;
            values.companyIds = values.types
            // 信息比对
            // const result = this.dataContrast(values);
            const result = {
                id: sessionStorage.orgId,
                name: values.name,
                type: values.companyIds,
                typeIds: [0],
                telephone: values.telephone,
                // photos: photoTemp,
                photos: [0],
                resources: this.state.fileList,
                description: values.description,
                businessHours: values.businessHours,
                scope: values.scope, 
                classNumber: values.classNumber, 
                teacherNumber: values.teacherNumber,
                icon: values.icon,
                provinceName:  values.provinceName,
                provinceId: values.provinceId,
                cityName: values.cityName,
                cityId: values.cityId,
                areaName: values.areaName,
                areaId: values.areaId,
                street: values.street,
                address: values.address,
                lng: values.lng,
                lat: values.lat,
                detailedAddress: values.detailedAddress, 
                companyName: values.companyName, 
                licenseNumber: values.licenseNumber, 
                additionalProtocol: values.additionalProtocol,
            };

            if (!result) {
                message.error("暂无信息更改");
                return;
            }
            // 修改项提交，状态变为待审核
            result.status = 1;
            this.setState({
                confirmLoading: true
            });
            reqwest({
                url: '/admin/org/update',
                type: 'json',
                method: 'post',
                headers: {
                    Authorization: sessionStorage.token
                },
                data: result,
                error: (XMLHttpRequest) => {
                    message.error("保存失败");
                    this.setState({
                        confirmLoading: false
                    })
                },
                success: (json) => {
                    if (json.result === 0) {
                        // message.success("机构信息修改成功，已提交审核");
                        this.countDownTip();
                        this.setState({
                            visible: false
                        }, () => {
                            this.setState({
                                data: {},
                                typeList: [],
                                viewPic01: "",
                                photoList01: [],
                                avatarEditor01: {
                                    scale: 1,
                                    positionX: 0.5,
                                    positionY: 0.5
                                },
                                photoLoading: false,
                                viewPic02: "",
                                data_pic02: "",
                                effectPic02: "",
                                avatarEditor02: {
                                    scale: 1,
                                    positionX: 0.5,
                                    positionY: 0.5
                                },
                                logoLoading: false,
                                provinceList: [],
                                cityList: [],
                                districtList: [],
                                streetList: [],
                                markers: [],
                                area: {
                                    province: "",
                                    city: "",
                                    district: "",
                                    street: ""
                                },
                                mapObj: {},
                                formattedAddress: "",
                                xy: {},
                                areaId: null,
                                addressLoading: true,
                                confirmLoading: false,
                                readlyOnly: true,
                            });
                            this.getData();                          
                        });
                    } else {
                        if (json.code === 901) {
                            message.error("请先登录");
                            // 返回登陆页
                            this.props.toLoginPage();
                        } else if (json.code === 902) {
                            message.error("登录信息已过期，请重新登录");
                            // 返回登陆页
                            this.props.toLoginPage();
                        } else if (json.code === "1127") {
                            message.error("已修改信息正在审核中，暂不能修改");
                            this.setState({
                                confirmLoading: false
                            })
                        } else {
                            message.error(json.message);
                            this.setState({
                                confirmLoading: false
                            })
                        }
                    }
                }
            });
        });
    };

     // 倒计时
    countDownTip = () => {
        let secondsToGo = 3;
        const modal = Modal.success({
            title: `友情提示`,
            content: `修改公司成功，正在返回，请稍后 ${secondsToGo} s.`,
        });
        const timer = setInterval(() => {
            secondsToGo -= 1;
            modal.update({
               content: `修改公司成功，正在返回，请稍后 ${secondsToGo} s.`,
            });
        }, 1000);
        setTimeout(() => {
            clearInterval(timer);
            modal.destroy();
        }, secondsToGo * 1000);
    };

    saveFormRef = (form) => {
        this.form = form;
    };

    componentWillMount() {
        // 获取机构基本信息
        this.getData();
        // 获取机构类型列表
        this.getInstitutionTypeList();
        // 获取图片上传token
        this.reqwestUploadToken();
        this.setState({visible: true},() => {
            this.getInstitutionTypeList();
            setTimeout(() => {
                this.setState({
                    mapObj: new window.AMap.Map('add-institution-container', {
                        resizeEnable: true,
                        zoom: 16
                    })
                }, () => {
                    this.getProvinceList();
                    window.AMap.service('AMap.Geocoder', () => {
                        const geocoder = new window.AMap.Geocoder({extensions: "all"});
                        this.state.mapObj.on('click', (e) => {
                            // 清除已有标记点
                            this.state.mapObj.remove(this.state.markers);
                            // 经纬度写入
                            this.setXY({x: e.lnglat.lng, y: e.lnglat.lat});
                            // 生成当前标记点
                            const marker = new window.AMap.Marker({
                                map: this.state.mapObj,
                                bubble: true
                            });
                            marker.setPosition(e.lnglat);
                            this.state.mapObj.setCenter(marker.getPosition());
                            this.state.markers.push(marker);
                            geocoder.getAddress([e.lnglat.lng, e.lnglat.lat], (status, result) => {
                                if (status === 'complete' && result.info === 'OK') {
                                    this.setFormattedAddress(result.regeocode.formattedAddress);
                                    // 其他地址信息写入
                                    this.setArea(5, result.regeocode.addressComponent);
                                }
                            });
                        });
                    })
                })
            }, 500)
        })        
    };

    render() {
        return (
            <ItemEditForm
                style={{width: "100%"}}
                ref={this.saveFormRef}
                editCompany={this.editCompany}
                readlyOnly={this.state.readlyOnly}
                onCancel={this.handleCancel}
                onCreate={this.handleCreate}
                id={this.props.id}
                data={this.state.data}
                typeList={this.state.typeList}
                setPhone={this.setPhone}
                countDown={this.state.countDown}
                codeButtonStatus={this.state.codeButtonStatus}
                getCode={this.getCode}
                reqwestUploadToken={this.reqwestUploadToken}
                beforeUpload03={this.beforeUpload03}
                viewPic01={this.state.viewPic01}
                setViewPic01={this.setViewPic01}
                picUpload01={this.picUpload01}
                avatarEditor01={this.state.avatarEditor01}
                setAvatarEditor01={this.setAvatarEditor01}
                photoList01={this.state.photoList01}
                setPhotoList01={this.setPhotoList01}
                photoLoading={this.state.photoLoading}
                viewPic02={this.state.viewPic02}
                data_pic02={this.state.data_pic02}
                setViewPic02={this.setViewPic02}
                effectPic02={this.state.effectPic02}
                picUpload02={this.picUpload02}
                avatarEditor02={this.state.avatarEditor02}
                setAvatarEditor02={this.setAvatarEditor02}
                logoLoading={this.state.logoLoading}
                provinceList={this.state.provinceList}
                cityList={this.state.cityList}
                districtList={this.state.districtList}
                streetList={this.state.streetList}
                markers={this.state.markers}
                setMarkers={this.setMarkers}
                area={this.state.area}
                setArea={this.setArea}
                mapObj={this.state.mapObj}
                formattedAddress={this.state.formattedAddress}
                setFormattedAddress={this.setFormattedAddress}
                setXY={this.setXY}
            />
        );
    }
}

class MyCompany extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opObj: {},
            type: '1',
            // 获取公司列表所需关键词
            keyword: {
                cityCode: "",
                educationName: "",
                startTime: "",
                endTime: "",
            },
            flag_add: false,
        };
    }

    // 获取当前登录人对此菜单的操作权限
    setPower = () => {
        // 菜单信息为空则直接返回登陆页
        if (!sessionStorage.menuList) {
            this.toLoginPage();
            return
        }
        JSON.parse(sessionStorage.menuList).forEach((item) => {
            item.children.forEach((subItem) => {
                if (subItem.url === this.props.location.pathname) {
                    let data = {};
                    subItem.children.forEach((thirdItem) => {
                        data[thirdItem.url] = true;
                    });
                    this.setState({
                        opObj: data
                    })
                }
            })
        })
    };

    // 登陆信息过期或不存在时的返回登陆页操作
    toLoginPage = () => {
        sessionStorage.clear();
        this.props.history.push('/')
    };

    componentWillMount() {
        this.setPower();
        if (this.props.location.search) {
            this.props.history.push(this.props.location.pathname)
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.location.search) {
            this.props.history.push(nextProps.location.pathname);
            this.setFlag();
        }
    }

    render() {
        return (
            <Router>
                <div className="institutions">
                    {
                        <div>
                            
                            <div className="companyEdit" style={{width: "100%", maxHeight: "600px", overflowY: "scroll"}}>
                                <ItemEdit opStatus={this.state.opObj.add} toLoginPage={this.toLoginPage}/>
                            </div>              
                        </div>
                    }
                </div>
            </Router>   
        )
    }
}

export default MyCompany;