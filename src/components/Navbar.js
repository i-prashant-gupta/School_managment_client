import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from 'axios'

const Home = () => {
  const [members, setMembers] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    getAllStudents()
    // Required to enable Bootstrap modal when using in React
    window.bootstrap = require("bootstrap/dist/js/bootstrap.bundle");
  }, []);

  useEffect(() => {
    if (members) {
      const filtered = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.age.toString().includes(searchTerm)
      );
      setFilteredMembers(filtered);
      setCurrentPage(1); // Reset to first page when search changes
    }
  }, [searchTerm, members]);

  const [newMember, setNewMember] = useState({ name: "", email: "", age: "" });
  const getAllStudents = async() => {
    try {
      const response = await axios.get('http://localhost:1000/user/getUser');
      if(response.status) {
        setMembers(response.data.data)

      } else {
        Swal.fire({
          icon: "error",
          title: "Server Error",
          text: "Something went wrong!",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong!",
      });
      console.error('Error creating user:', error.response ? error.response.data : error.message);
    }
  }

  const handleDelete = (id) => {
    try {
    const member = members.find((m) => m.id === id);

      Swal.fire({
        title: "Are you sure?",
        text: `If you delete ${member.name}, this action cannot be undone!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      }).then(async (result) => {
        if (result.isConfirmed) {
         
          const response = await axios.post('http://localhost:1000/user/deleteUser', { 'id': member.id })
          if(response.status) {
            Swal.fire("Deleted!", "Member has been deleted.", "success");
            getAllStudents()
          } else {
            Swal.fire({
              icon: "error",
              title: "Server Error",
              text: "Something went wrong!",
            });
          }
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong!",
      });
    }


  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!newMember.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(newMember.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!newMember.age) {
      errors.age = "Age is required";
    } else if (isNaN(newMember.age) || newMember.age < 1 || newMember.age > 120) {
      errors.age = "Please enter a valid age between 1 and 120";
    }

    if (!newMember.name) {
      errors.name = "Name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (key) => {
    if (!validateForm()) {
      return;
    }

    if(key == 'update') {
      const newId = Math.max(...members.map((m) => m.id)) + 1;
      const newEntry = { ...newMember, id: newId, age: parseInt(newMember.age) };
  
      setMembers([...members, newEntry]);
      setNewMember({ name: "", email: "", age: "" });
    }

    try {
      const insertData = newMember ? newMember : "";
      const response = await axios.post('http://localhost:1000/user/insert', insertData);
      
      if (response.status) {
        Swal.fire("Created!", "New member has been added.", "success");
        // Fetch the updated list of members
        await getAllStudents();
        // Hide modal
        const modal = window.bootstrap.Modal.getInstance(
          document.getElementById("addMemberModal")
        );
        modal.hide();
        // Reset the form
        setNewMember({ name: "", email: "", age: "" });
        setFormErrors({});
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong!",
      });
      console.error('Error creating user:', error.response ? error.response.data : error.message);
    }
  };
const [isEditing, setIsEditing] = useState(false);
const [editingId, setEditingId] = useState(null);


  // const handleUpdate = (id) => {
  //   const member = members.find((m) => m.id === id);
  //   console.log(member)
  //   setNewMember(member)
  // }
  const handleUpdate = (id) => {
    const member = members.find((m) => m.id === id);
    setNewMember(member);
    setIsEditing(true);
    setEditingId(id);
  };
  

  const handleUpdateData = async () => {
    try {
      const updatedData = { ...newMember, id: editingId };
      const response = await axios.post('http://localhost:1000/user/updateUser', updatedData);
      
      if (response.status) {
        Swal.fire("Updated!", "Member has been updated.", "success");
        getAllStudents();
        const modal = window.bootstrap.Modal.getInstance(
          document.getElementById("addMemberModal")
        );
        modal.hide();
        setIsEditing(false);
        setEditingId(null);
        setNewMember({ name: "", email: "", age: "" });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong!",
      });
      console.error('Error updating user:', error.response ? error.response.data : error.message);
    }
  };
  
  

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>All Members</h4>
        <button
          className="btn btn-success"
          data-bs-toggle="modal"
          data-bs-target="#addMemberModal"
        >
          Add New Member
        </button>
      </div>

      <input 
        type="text" 
        placeholder="Search by name, email or age..." 
        className="form-control mb-3" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table className="table table-bordered table-hover">
        <thead className="table-light">
          <tr>
            <th>Id</th>
            <th>Member Name</th>
            <th>Member Email</th>
            <th>Age</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentItems && currentItems.map((m) => (
            <tr key={m.id}>
              <td onClick={() => handleUpdate(m.id)} data-bs-toggle="modal"
                data-bs-target="#addMemberModal">{m.id}</td>
              <td>{m.name}</td>
              <td>{m.email}</td>
              <td>{m.age}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(m.id)}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredMembers.length)} of {filteredMembers.length} entries
          {searchTerm && ` (filtered from ${members.length} total entries)`}
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <div>
            <select 
              className="form-select form-select-sm" 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: 'auto' }}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
          
          {totalPages > 1 && (
            <nav aria-label="Page navigation">
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(totalPages)].map((_, index) => (
                  <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => paginate(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      {/* Modal */}
      <div
        className="modal fade"
        id="addMemberModal"
        tabIndex="-1"
        aria-labelledby="addMemberModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addMemberModalLabel">
                Add New Member
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">Member Name</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                    value={newMember.name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, name: e.target.value })
                    }
                  />
                  {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember({ ...newMember, email: e.target.value })
                    }
                  />
                  {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    className={`form-control ${formErrors.age ? 'is-invalid' : ''}`}
                    value={newMember.age}
                    onChange={(e) =>
                      setNewMember({ ...newMember, age: e.target.value })
                    }
                  />
                  {formErrors.age && <div className="invalid-feedback">{formErrors.age}</div>}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={isEditing ? handleUpdateData : handleCreate}
              >
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
