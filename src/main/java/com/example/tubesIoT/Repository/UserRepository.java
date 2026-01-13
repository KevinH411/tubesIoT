package com.example.tubesIoT.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.tubesIoT.Model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
}
