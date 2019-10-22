package com.access.control.services;

import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;
import com.access.control.repository.EmpleadoRepository;
import com.access.control.repository.PisoPermisoRepository;
import org.dozer.DozerBeanMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service("empleadosServiceImpl")
public class EmpleadosServiceImpl implements EmpleadosService{
    @Autowired
    private EmpleadoRepository empleadosDao;

    @Autowired
    private PisoPermisoRepository pisoPermisoRepository;

    @Override
    @Transactional
    public List<Empleado> getListEmpleados(boolean picture)
    {   Integer i=0;
        List<Empleado> emp = empleadosDao.findAll();
       /* if (picture) {
          for (i=0 ; i < emp.size(); i++){
              byte[] b = "No disponible".getBytes();
              emp.get(i).setPicture(b);
              emp.get(i).setHuella1(b);
              emp.get(i).setHuella2(b);
          }
        }*/
        return emp;
    }

    @Override
    @Transactional
    public Empleado getEmpleadoById(Long idEmpleado)
    {
        return empleadosDao.findById(idEmpleado).orElse(null);
    }

    @Override
    @Transactional
    public Empleado addEmpleado(EmpleadoDto emp)
    {
        //emp.setPicture(Base64.getDecoder().decode(emp.getPicture()));
       // emp.setPicture(Arrays.asList(emp.getPicture().split(",")).get(1));
        //String encodedString = Base64.getEncoder().encodeToString(emp.geticture());
        //Empleado empleado = new DozerBeanMapper().map(emp, Empleado.class);
        Empleado empleado = new Empleado();
        empleado.setDocument(emp.getDocument());
        empleado.setName(emp.getName());
        empleado.setBadgeAccess(emp.getBadgeAccess());
        empleado.setLastName(emp.getLastName());
        empleado.setBirthDate(emp.getBirthDate());
        empleado.setEmail(emp.getEmail());
        empleado.setSex(emp.getSex());
        empleado.setTelephone(emp.getTelephone());
        empleado.setEnabled(true);
        empleado.setState(1);
        empleado.setPicture(Base64.getDecoder().decode(Arrays.asList(emp.getPicture().split(",")).get(1)));
        return empleadosDao.save(empleado);
    }

    @Override
    @Transactional
    public Empleado updateEmpleado(Empleado emp,Long id)
    {
        if(empleadosDao.findById(id).isPresent()){
            return empleadosDao.saveAndFlush(emp);
        }
        return null;
    }

    @Override
    @Transactional
    public boolean deleteEmpleado(Empleado emp)
    {
         empleadosDao.delete(emp);
         return empleadosDao.findById(emp.getId()).isPresent();
    }

    @Override
    @Transactional
    public Empleado updatePisos(Empleado emp){

        pisoPermisoRepository.saveAll(emp.getListPisos());

        return emp;
    }
}
