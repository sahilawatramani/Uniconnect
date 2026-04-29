import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Card } from 'antd';
import { ApartmentOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './CrudPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const { authAxios, isAdmin } = useAuth();

    useEffect(() => { fetchDepartments(); }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try { const res = await authAxios.get(`${API_URL}/api/departments`); setDepartments(res.data); }
        catch { message.error('Failed to fetch departments'); }
        finally { setLoading(false); }
    };

    const columns = [
        { title: 'Dept ID', dataIndex: 'department_id', key: 'department_id', width: 100 },
        { title: 'Department Name', dataIndex: 'department_name', key: 'department_name' },
        { title: 'Head of Department', dataIndex: 'head_of_department', key: 'hod' },
        ...(isAdmin ? [{
            title: 'Actions', key: 'actions', width: 160,
            render: (_, r) => (<>
                <Button className="action-btn edit-btn" onClick={() => handleEdit(r)}>Edit</Button>
                <Button className="action-btn delete-btn" onClick={() => handleDelete(r.department_id)}>Delete</Button>
            </>),
        }] : []),
    ];

    const handleAddEdit = async () => {
        try {
            const values = await form.validateFields();
            if (editingDept) {
                await authAxios.put(`${API_URL}/api/departments/${editingDept.department_id}`, values);
                message.success('Department updated');
            } else {
                await authAxios.post(`${API_URL}/api/departments`, values);
                message.success('Department added');
            }
            setIsModalOpen(false); form.resetFields(); setEditingDept(null); fetchDepartments();
        } catch (err) { message.error(err.response?.data?.error || 'Failed to save department'); }
    };

    const handleEdit = (dept) => {
        form.setFieldsValue(dept); setEditingDept(dept); setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try { await authAxios.delete(`${API_URL}/api/departments/${id}`); message.success('Department deleted'); fetchDepartments(); }
        catch { message.error('Failed to delete department'); }
    };

    return (
        <div className="crud-page">
            <div className="crud-header">
                <div className="crud-header-left">
                    <div className="crud-header-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}><ApartmentOutlined /></div>
                    <div><h1>Departments</h1><p>University departments directory</p></div>
                </div>
                {isAdmin && <Button type="primary" icon={<PlusOutlined />} className="add-btn" onClick={() => { setIsModalOpen(true); setEditingDept(null); }}>Add Department</Button>}
            </div>
            <div className="crud-body">
                <Card className="crud-table-card">
                    <Table columns={columns} dataSource={departments} rowKey="department_id" loading={loading} pagination={{ pageSize: 10 }} />
                </Card>
            </div>
            {isAdmin && (
                <Modal title={editingDept ? "Edit Department" : "Add Department"} open={isModalOpen} onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingDept(null); }} onOk={handleAddEdit}>
                    <Form form={form} layout="vertical">
                        <Form.Item name="department_name" label="Department Name" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="head_of_department" label="Head of Department" rules={[{ required: true }]}><Input /></Form.Item>
                    </Form>
                </Modal>
            )}
        </div>
    );
};

export default Departments;
