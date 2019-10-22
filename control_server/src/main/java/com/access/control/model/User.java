package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "user")
public class User extends AbstractEntity implements Serializable {

    @Column
    private String username;

    @Column
    private String password;

    @Column
    private boolean enabled;


    public User(String username, String password, List grantList) {
        this.username = username;
        this.password = password;
        this.setAuthority((Set<Authority>)grantList);
    }

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name="authorities_users",
            joinColumns=@JoinColumn(name="user_id"),
            inverseJoinColumns=@JoinColumn(name="authority_id"))
    private Set<Authority> authority;

    public Set<Authority> getAuthority(){
      return authority;
    }

//Getters y Setters


    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public void setAuthority(Set<Authority> authority) {
        this.authority = authority;
    }

    public User() {
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((this.getId() == null) ? 0 :this.getId().hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        User other = (User) obj;
        if (getId() == null) {
            if (other.getId() != null)
                return false;
        } else if (!getId().equals(other.getId()))
            return false;
        return true;
    }

    @Override
    public String toString() {
        return "User [id=" + getId() + ", username=" + username + ", password=" + password + "]";
    }

}
